<script setup lang="ts">
  import type { Application, Container, FederatedPointerEvent } from 'pixi.js';

  import type { PlanPoint, PlanPreview } from '../../composables';
  import type {
    FurnitureKind,
    PlanArea,
    PlanDocument,
    PlanTool,
  } from '../../model';
  import type { PlanCursor, PlanLayers, TextFactory } from '../renderer';

  import { usePlanTheme } from '../../composables';
  import {
    getLevelCenter,
    PLAN_CELL_PIXELS,
    PLAN_START_FOCUS,
    PLAN_WHEEL_ROTATE_MS,
    PLAN_ZOOM_MAX,
    PLAN_ZOOM_MIN,
    PLAN_ZOOM_STEP,
  } from '../../model';
  import { drawGrid, drawPlan } from '../renderer';

  /**
   * Холст плана на WebGL (PixiJS). Рисует план и сообщает родителю точки
   * указателя в клетках; что с ними делать, решает редактор. Сам холст умеет
   * только панораму и зум: колесо — зум у курсора, средняя или правая кнопка,
   * пробел или инструмент «рука» — панорама.
   */
  const props = defineProps<{
    document: PlanDocument;
    level: number;
    tool: PlanTool;
    selectedRoomId: string | undefined;
    facilityColors: ReadonlyMap<string, number>;
    facilityAreas: ReadonlyMap<string, { used: number; squares: number }>;
    preview: PlanPreview | undefined;
    hoverPoint: PlanPoint | undefined;
    /** Указатели соавторов на этом этаже. */
    cursors: ReadonlyArray<PlanCursor>;
    /** Выделенный участок на этом этаже. */
    area: PlanArea | undefined;
    furnitureKind: FurnitureKind;
    /** Поворот предмета, который поставит инструмент мебели. */
    furnitureRotation: number;
  }>();

  const emit = defineEmits<{
    'point-down': [point: PlanPoint];
    'point-move': [point: PlanPoint, isPressed: boolean];
    'point-up': [];
    'point-leave': [];
    /** Колесо с инструментом мебели: 1 — по часовой, -1 — против. */
    'rotate': [direction: 1 | -1];
  }>();

  /** Когда колесо последний раз повернуло мебель: тачпад шлёт много мелких событий. */
  let lastRotateAt = 0;

  const container = useTemplateRef('container');
  const { theme } = usePlanTheme();
  const keys = useMagicKeys();
  const isSpacePressed = computed(() => !!keys.space?.value);

  let application: Application | undefined;
  let world: Container | undefined;
  let layers: PlanLayers | undefined;
  let createText: TextFactory | undefined;

  const isPanning = ref(false);

  let isPressed = false;
  let lastPan: { x: number; y: number } | undefined;

  const cursor = computed(() => {
    if (isPanning.value) {
      return 'cursor-grabbing';
    }

    return props.tool === 'pan' || isSpacePressed.value
      ? 'cursor-grab'
      : 'cursor-crosshair';
  });

  /** Перерисовывает план с текущим масштабом. */
  function render(): void {
    if (!layers || !world || !createText) {
      return;
    }

    drawPlan(
      layers,
      {
        document: props.document,
        level: props.level,
        tool: props.tool,
        selectedRoomId: props.selectedRoomId,
        facilityColors: props.facilityColors,
        facilityAreas: props.facilityAreas,
        preview: props.preview,
        hoverPoint: props.hoverPoint,
        cursors: props.cursors,
        area: props.area,
        furnitureKind: props.furnitureKind,
        furnitureRotation: props.furnitureRotation,
      },
      theme.value,
      world.scale.x,
      createText,
    );
  }

  /**
   * Точка указателя в клетках.
   *
   * @param event Событие PixiJS.
   * @returns Точка на плане.
   */
  function toPlanPoint(event: FederatedPointerEvent): PlanPoint {
    const local = world
      ? world.toLocal(event.global)
      : { x: event.global.x, y: event.global.y };

    return { x: local.x / PLAN_CELL_PIXELS, y: local.y / PLAN_CELL_PIXELS };
  }

  /**
   * Нужна ли панорама для этого нажатия.
   *
   * @param event Событие PixiJS.
   * @returns true для средней и правой кнопки, пробела и «руки».
   */
  function isPanGesture(event: FederatedPointerEvent): boolean {
    return (
      event.button === 1
      || event.button === 2
      || props.tool === 'pan'
      || isSpacePressed.value
    );
  }

  /**
   * Нажатие: панорама или точка для редактора.
   *
   * @param event Событие PixiJS.
   */
  function handlePointerDown(event: FederatedPointerEvent): void {
    if (isPanGesture(event)) {
      isPanning.value = true;
      lastPan = { x: event.global.x, y: event.global.y };

      return;
    }

    isPressed = true;
    emit('point-down', toPlanPoint(event));
  }

  /**
   * Движение: сдвиг холста при панораме, иначе точка для редактора.
   *
   * @param event Событие PixiJS.
   */
  function handlePointerMove(event: FederatedPointerEvent): void {
    if (isPanning.value && lastPan && world) {
      world.position.set(
        world.position.x + event.global.x - lastPan.x,
        world.position.y + event.global.y - lastPan.y,
      );

      lastPan = { x: event.global.x, y: event.global.y };

      return;
    }

    emit('point-move', toPlanPoint(event), isPressed);
  }

  /** Отпускание: конец панорамы или мазка. */
  function handlePointerUp(): void {
    if (isPanning.value) {
      isPanning.value = false;
      lastPan = undefined;

      return;
    }

    if (isPressed) {
      isPressed = false;
      emit('point-up');
    }
  }

  /**
   * Меняет масштаб так, чтобы точка экрана осталась на месте.
   *
   * @param factor Во сколько раз изменить масштаб.
   * @param screenX Точка на холсте, x.
   * @param screenY Точка на холсте, y.
   */
  function zoomAt(factor: number, screenX: number, screenY: number): void {
    if (!world) {
      return;
    }

    const scale = Math.min(
      PLAN_ZOOM_MAX,
      Math.max(PLAN_ZOOM_MIN, world.scale.x * factor),
    );

    const localX = (screenX - world.position.x) / world.scale.x;
    const localY = (screenY - world.position.y) / world.scale.y;

    world.scale.set(scale);
    world.position.set(screenX - localX * scale, screenY - localY * scale);
    render();
  }

  /**
   * Зум колесом у курсора: точка под курсором остаётся на месте. С
   * инструментом мебели Ctrl+колесо поворачивает предмет.
   *
   * @param event Событие колеса.
   */
  function handleWheel(event: WheelEvent): void {
    if (!application) {
      return;
    }

    event.preventDefault();

    if (props.tool === 'furniture' && (event.ctrlKey || event.metaKey)) {
      if (
        event.deltaY !== 0
        && event.timeStamp - lastRotateAt > PLAN_WHEEL_ROTATE_MS
      ) {
        lastRotateAt = event.timeStamp;
        emit('rotate', event.deltaY > 0 ? 1 : -1);
      }

      return;
    }

    const rect = application.canvas.getBoundingClientRect();

    zoomAt(
      event.deltaY < 0 ? PLAN_ZOOM_STEP : 1 / PLAN_ZOOM_STEP,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  }

  /**
   * Зум кнопками: относительно середины холста.
   *
   * @param direction Крупнее или мельче.
   */
  function zoomStep(direction: 'in' | 'out'): void {
    if (!application) {
      return;
    }

    const factor = PLAN_ZOOM_STEP * PLAN_ZOOM_STEP;

    zoomAt(
      direction === 'in' ? factor : 1 / factor,
      application.screen.width / 2,
      application.screen.height / 2,
    );
  }

  /**
   * Показывает на старте середину этажа или угол участка, если он пуст.
   */
  function centerView(): void {
    if (!world || !application) {
      return;
    }

    const focus =
      getLevelCenter(props.document, props.level) ?? PLAN_START_FOCUS;

    world.position.set(
      application.screen.width / 2 - focus.x * PLAN_CELL_PIXELS * world.scale.x,
      application.screen.height / 2
        - focus.y * PLAN_CELL_PIXELS * world.scale.y,
    );
  }

  onMounted(async () => {
    const element = container.value;

    if (!element) {
      return;
    }

    const pixi = await import('pixi.js');

    // CSP сайта запрещает eval, а PixiJS по умолчанию собирает шейдеры и
    // синхронизацию униформ через new Function; модуль подменяет это на
    // заранее собранные функции.
    await import('pixi.js/unsafe-eval');

    application = new pixi.Application();

    await application.init({
      resizeTo: element,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      background: theme.value.background,
    });

    element.append(application.canvas);

    world = new pixi.Container();

    layers = {
      grid: new pixi.Graphics(),
      content: new pixi.Graphics(),
      overlay: new pixi.Graphics(),
      labels: new pixi.Container(),
    };

    world.addChild(layers.grid, layers.content, layers.labels, layers.overlay);
    application.stage.addChild(world);

    const fontFamily = getComputedStyle(document.body).fontFamily;

    createText = (text, style) =>
      new pixi.Text({
        text,
        resolution: window.devicePixelRatio,
        style: {
          fontFamily,
          fontSize: style.size,
          fontWeight: style.isBold ? '700' : '400',
          fill: style.color,
          stroke: { color: theme.value.background, width: 3 },
        },
      });

    const stage = application.stage;

    stage.eventMode = 'static';
    stage.hitArea = application.screen;
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup', handlePointerUp);
    stage.on('pointerupoutside', handlePointerUp);
    stage.on('pointerleave', () => emit('point-leave'));

    application.canvas.addEventListener('wheel', handleWheel, {
      passive: false,
    });

    application.canvas.addEventListener('contextmenu', (event) =>
      event.preventDefault(),
    );

    drawGrid(layers.grid, theme.value);
    centerView();
    render();
  });

  onBeforeUnmount(() => {
    application?.destroy(true, { children: true });
    application = undefined;
    world = undefined;
    layers = undefined;
  });

  // Сетка зависит только от темы, всё остальное перерисовывается на каждую
  // правку — план небольшой, и полная перерисовка дешевле учёта изменений.
  watch(theme, (current) => {
    if (layers && application) {
      application.renderer.background.color = current.background;
      drawGrid(layers.grid, current);
      render();
    }
  });

  watch(
    () => [
      props.document,
      props.level,
      props.tool,
      props.selectedRoomId,
      props.facilityColors,
      props.facilityAreas,
      props.preview,
      props.hoverPoint,
      props.cursors,
      props.area,
      props.furnitureKind,
      props.furnitureRotation,
    ],
    render,
  );

  /** Сбрасывает масштаб и показывает середину этажа. */
  function resetView(): void {
    world?.scale.set(1);
    centerView();
    render();
  }

  defineExpose({ resetView, zoomStep });
</script>

<template>
  <div
    ref="container"
    class="relative h-full w-full touch-none overflow-hidden rounded-lg border border-default select-none"
    :class="cursor"
  />
</template>
