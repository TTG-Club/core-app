<script setup lang="ts">
  import type { Application, Container, FederatedPointerEvent } from 'pixi.js';

  import type { PlanDraft, PlanPoint } from '../../composables';
  import type { PlanCell, PlanDocument, PlanTool } from '../../model';
  import type { PlanLayers, TextFactory } from '../renderer';

  import { usePlanTheme } from '../../composables';
  import {
    getOutlineCenter,
    PLAN_CELL_PIXELS,
    PLAN_START_FOCUS,
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
    selectedBuildingId: string | undefined;
    facilityColors: ReadonlyMap<string, number>;
    draft: PlanDraft | undefined;
    hoverCell: PlanCell | undefined;
  }>();

  const emit = defineEmits<{
    'point-down': [point: PlanPoint];
    'point-move': [point: PlanPoint, isPressed: boolean];
    'point-up': [];
    'point-leave': [];
  }>();

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
        selectedBuildingId: props.selectedBuildingId,
        facilityColors: props.facilityColors,
        draft: props.draft,
        hoverCell: props.hoverCell,
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
   * Зум колесом у курсора: точка под курсором остаётся на месте.
   *
   * @param event Событие колеса.
   */
  function handleWheel(event: WheelEvent): void {
    if (!world || !application) {
      return;
    }

    event.preventDefault();

    const factor = event.deltaY < 0 ? PLAN_ZOOM_STEP : 1 / PLAN_ZOOM_STEP;

    const scale = Math.min(
      PLAN_ZOOM_MAX,
      Math.max(PLAN_ZOOM_MIN, world.scale.x * factor),
    );

    const rect = application.canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const localX = (pointerX - world.position.x) / world.scale.x;
    const localY = (pointerY - world.position.y) / world.scale.y;

    world.scale.set(scale);
    world.position.set(pointerX - localX * scale, pointerY - localY * scale);
    render();
  }

  /**
   * Показывает на старте середину плана: первый корпус или угол участка.
   */
  function centerView(): void {
    if (!world || !application) {
      return;
    }

    const firstBuilding = props.document.buildings[0];

    const focus = firstBuilding
      ? getOutlineCenter(firstBuilding.outline)
      : PLAN_START_FOCUS;

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

    createText = (text, color) =>
      new pixi.Text({
        text,
        style: { fontFamily: 'sans-serif', fontSize: 13, fill: color },
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
      props.selectedBuildingId,
      props.facilityColors,
      props.draft,
      props.hoverCell,
    ],
    render,
  );

  /** Сбрасывает масштаб и показывает первый корпус. */
  function resetView(): void {
    world?.scale.set(1);
    centerView();
    render();
  }

  defineExpose({ resetView });
</script>

<template>
  <div
    ref="container"
    class="relative h-full w-full touch-none overflow-hidden rounded-lg border border-default select-none"
    :class="cursor"
  />
</template>
