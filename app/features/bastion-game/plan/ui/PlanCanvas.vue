<script setup lang="ts">
  import type { Application, Container, FederatedPointerEvent } from 'pixi.js';

  import type { PlanPoint, PlanPreview } from '../../composables';
  import type {
    FurnitureKind,
    PlanDocument,
    PlanSelection,
    PlanTool,
  } from '../../model';
  import type { PlanCursor, PlanLayers, TextFactory } from '../renderer';

  import { usePlanTheme } from '../../composables';
  import {
    getLevelCenter,
    PLAN_CELL_PIXELS,
    PLAN_CONTEXT_MENU_TOLERANCE,
    PLAN_FACILITY_DRAG_TYPE,
    PLAN_LONG_PRESS_MS,
    PLAN_START_FOCUS,
    PLAN_TOUCH_HOLD_MS,
    PLAN_TOUCH_TOLERANCE,
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
   * пробел или инструмент «рука» — панорама. Щелчок правой кнопкой без сдвига
   * просит контекстное меню.
   *
   * На сенсорном экране один палец рисует тем же инструментом, два пальца
   * двигают и масштабируют план, а долгое нажатие с инструментом «Выбрать»
   * добавляет объект к выбору и открывает меню — как Shift и правая кнопка.
   */
  const props = defineProps<{
    document: PlanDocument;
    level: number;
    tool: PlanTool;
    /** Выбранные объекты плана. */
    selection: PlanSelection;
    facilityColors: ReadonlyMap<string, number>;
    facilityAreas: ReadonlyMap<string, { used: number; squares: number }>;
    preview: PlanPreview | undefined;
    hoverPoint: PlanPoint | undefined;
    /** Указатели соавторов на этом этаже. */
    cursors: ReadonlyArray<PlanCursor>;
    furnitureKind: FurnitureKind;
    /** Поворот предмета, который поставит инструмент мебели. */
    furnitureRotation: number;
    /** Заданная сторона винтовой лестницы; undefined — наибольшая. */
    spiralSide: number | undefined;
  }>();

  const emit = defineEmits<{
    /** `isAdditive` — зажат Shift или Ctrl: добавить к выбору. */
    'point-down': [point: PlanPoint, isAdditive: boolean];
    'point-move': [point: PlanPoint, isPressed: boolean];
    'point-up': [];
    /** Жест оборван без изменений: на экран лёг второй палец. */
    'point-cancel': [];
    'point-leave': [];
    /**
     * Ctrl+колесо у мебели и лестницы: 1 — от себя к себе (по часовой,
     * меньше), -1 — наоборот.
     */
    'wheel-step': [direction: 1 | -1];
    /** Щелчок правой кнопкой без панорамы: точка окна, где открыть меню. */
    'context-menu': [position: { x: number; y: number }];
    /** Сооружение тянут над планом; undefined — увели с холста. */
    'facility-drag': [point: PlanPoint | undefined];
    /** Сооружение отпустили над планом. */
    'facility-drop': [point: PlanPoint];
  }>();

  /** Когда Ctrl+колесо последний раз сработало: тачпад шлёт много мелких событий. */
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

  /** Где нажали правую кнопку: если её отпустят рядом, это щелчок. */
  let rightPressAt: { x: number; y: number } | undefined;

  /** Пальцы на холсте: точка экрана каждого. */
  const touches = new Map<number, { x: number; y: number }>();

  /** Середина и расстояние между двумя пальцами в прошлом кадре щипка. */
  let pinch: { x: number; y: number; distance: number } | undefined;

  /** Пальцы щипка ещё не все сняты: оставшийся палец не рисует. */
  let isTouchGesture = false;

  /**
   * Касание одним пальцем, которое ещё не стало мазком: оно ждёт, не ляжет ли
   * второй палец, сдвига или долгого нажатия.
   */
  let pendingTouch:
    | {
        point: PlanPoint;
        screen: { x: number; y: number };
        client: { x: number; y: number };
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;

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
        selection: props.selection,
        facilityColors: props.facilityColors,
        facilityAreas: props.facilityAreas,
        preview: props.preview,
        hoverPoint: props.hoverPoint,
        cursors: props.cursors,
        furnitureKind: props.furnitureKind,
        furnitureRotation: props.furnitureRotation,
        spiralSide: props.spiralSide,
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
   * Точка окна в клетках плана.
   *
   * @param event Событие перетаскивания.
   * @returns Точка на плане или undefined, пока холст не готов.
   */
  function toPlanPointFromClient(event: DragEvent): PlanPoint | undefined {
    if (!world || !application) {
      return undefined;
    }

    const rect = application.canvas.getBoundingClientRect();

    const local = world.toLocal({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    return { x: local.x / PLAN_CELL_PIXELS, y: local.y / PLAN_CELL_PIXELS };
  }

  /**
   * Тянут ли над холстом сооружение из боковой панели.
   *
   * @param event Событие перетаскивания.
   * @returns true для сооружения; файлы и текст холст не принимает.
   */
  function isFacilityDrag(event: DragEvent): boolean {
    return !!event.dataTransfer?.types.includes(PLAN_FACILITY_DRAG_TYPE);
  }

  /**
   * Сооружение над холстом: разрешает бросок и показывает, где встанет
   * комната.
   *
   * @param event Событие перетаскивания.
   */
  function handleDragOver(event: DragEvent): void {
    if (!isFacilityDrag(event)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    emit('facility-drag', toPlanPointFromClient(event));
  }

  /**
   * Сооружение увели с холста.
   *
   * @param event Событие перетаскивания.
   */
  function handleDragLeave(event: DragEvent): void {
    if (isFacilityDrag(event)) {
      emit('facility-drag', undefined);
    }
  }

  /**
   * Сооружение отпустили над холстом.
   *
   * @param event Событие перетаскивания.
   */
  function handleDrop(event: DragEvent): void {
    if (!isFacilityDrag(event)) {
      return;
    }

    event.preventDefault();

    const point = toPlanPointFromClient(event);

    if (point) {
      emit('facility-drop', point);
    }
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
   * Середина и расстояние между первыми двумя пальцами.
   *
   * @returns Данные щипка или undefined, если пальцев меньше двух.
   */
  function getPinch(): { x: number; y: number; distance: number } | undefined {
    const [first, second] = [...touches.values()];

    if (!first || !second) {
      return undefined;
    }

    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
      distance: Math.hypot(first.x - second.x, first.y - second.y),
    };
  }

  /**
   * Отложенное касание становится нажатием для редактора.
   *
   * @param isAdditive Добавить к выбору (долгое нажатие).
   */
  function flushPendingTouch(isAdditive: boolean): void {
    if (!pendingTouch) {
      return;
    }

    clearTimeout(pendingTouch.timer);

    const { point } = pendingTouch;

    pendingTouch = undefined;
    isPressed = true;
    emit('point-down', point, isAdditive);
  }

  /** Отложенное касание отменяется: лёг второй палец. */
  function dropPendingTouch(): void {
    if (pendingTouch) {
      clearTimeout(pendingTouch.timer);
      pendingTouch = undefined;
    }
  }

  /**
   * Долгое нажатие с инструментом «Выбрать»: объект добавляется к выбору, и
   * открывается меню, как от правой кнопки.
   */
  function handleLongPress(): void {
    const client = pendingTouch?.client;

    flushPendingTouch(true);

    if (isPressed) {
      isPressed = false;
      emit('point-up');
    }

    // Палец ещё на экране: до отпускания он больше ничего не делает.
    isTouchGesture = true;

    if (client) {
      emit('context-menu', client);
    }
  }

  /**
   * Палец лёг на холст. Второй палец обрывает мазок и начинает щипок; первый
   * ждёт, чтобы щипок не оставил на плане след.
   *
   * @param event Событие PixiJS.
   * @returns true, если касание обработано и мышиная логика не нужна.
   */
  function handleTouchDown(event: FederatedPointerEvent): boolean {
    touches.set(event.pointerId, { x: event.global.x, y: event.global.y });

    if (touches.size > 1) {
      dropPendingTouch();

      // Начатый мазок обрывается без изменений: пальцы легли для щипка.
      if (isPressed) {
        isPressed = false;
        emit('point-cancel');
      }

      isPanning.value = false;
      lastPan = undefined;
      isTouchGesture = true;
      pinch = getPinch();
      emit('point-leave');

      return true;
    }

    if (isTouchGesture || props.tool === 'pan') {
      return isTouchGesture;
    }

    const isSelect = props.tool === 'select';

    pendingTouch = {
      point: toPlanPoint(event),
      screen: { x: event.global.x, y: event.global.y },
      client: { x: event.clientX, y: event.clientY },
      timer: setTimeout(
        () => (isSelect ? handleLongPress() : flushPendingTouch(false)),
        isSelect ? PLAN_LONG_PRESS_MS : PLAN_TOUCH_HOLD_MS,
      ),
    };

    return true;
  }

  /**
   * Палец движется: щипок двигает и масштабирует план, отложенное касание
   * после заметного сдвига становится мазком.
   *
   * @param event Событие PixiJS.
   * @returns true, если движение обработано и мышиная логика не нужна.
   */
  function handleTouchMove(event: FederatedPointerEvent): boolean {
    if (!touches.has(event.pointerId)) {
      return true;
    }

    touches.set(event.pointerId, { x: event.global.x, y: event.global.y });

    if (isTouchGesture) {
      const next = getPinch();

      if (pinch && next && world) {
        world.position.set(
          world.position.x + next.x - pinch.x,
          world.position.y + next.y - pinch.y,
        );

        zoomAt(
          pinch.distance > 0 ? next.distance / pinch.distance : 1,
          next.x,
          next.y,
        );

        pinch = next;
      }

      return true;
    }

    if (pendingTouch) {
      const moved = Math.hypot(
        event.global.x - pendingTouch.screen.x,
        event.global.y - pendingTouch.screen.y,
      );

      if (moved <= PLAN_TOUCH_TOLERANCE) {
        return true;
      }

      flushPendingTouch(false);
    }

    return false;
  }

  /**
   * Палец снят. Короткое касание без сдвига — щелчок; после щипка холст ждёт,
   * пока снимут все пальцы. Без мыши подсветка под указателем не нужна.
   *
   * @param event Событие PixiJS.
   * @returns true, если отпускание обработано и мышиная логика не нужна.
   */
  function handleTouchUp(event: FederatedPointerEvent): boolean {
    touches.delete(event.pointerId);

    if (isTouchGesture) {
      pinch = getPinch();

      if (!touches.size) {
        isTouchGesture = false;
      }

      return true;
    }

    flushPendingTouch(false);

    // Палец двигал план инструментом «рука»: это доделает мышиная логика.
    if (isPanning.value) {
      return false;
    }

    if (isPressed) {
      isPressed = false;
      emit('point-up');
    }

    emit('point-leave');

    return true;
  }

  /**
   * Нажатие: панорама или точка для редактора.
   *
   * @param event Событие PixiJS.
   */
  function handlePointerDown(event: FederatedPointerEvent): void {
    if (event.pointerType === 'touch' && handleTouchDown(event)) {
      return;
    }

    if (isPanGesture(event)) {
      isPanning.value = true;
      lastPan = { x: event.global.x, y: event.global.y };

      rightPressAt =
        event.button === 2
          ? { x: event.global.x, y: event.global.y }
          : undefined;

      return;
    }

    isPressed = true;

    emit(
      'point-down',
      toPlanPoint(event),
      event.shiftKey || event.ctrlKey || event.metaKey,
    );
  }

  /**
   * Движение: сдвиг холста при панораме, иначе точка для редактора.
   *
   * @param event Событие PixiJS.
   */
  function handlePointerMove(event: FederatedPointerEvent): void {
    if (event.pointerType === 'touch' && handleTouchMove(event)) {
      return;
    }

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

  /**
   * Отпускание: конец панорамы или мазка. Правая кнопка, отпущенная почти там
   * же, где её нажали, — щелчок для контекстного меню.
   *
   * @param event Событие PixiJS.
   */
  function handlePointerUp(event: FederatedPointerEvent): void {
    if (event.pointerType === 'touch' && handleTouchUp(event)) {
      return;
    }

    if (isPanning.value) {
      isPanning.value = false;
      lastPan = undefined;

      if (
        rightPressAt
        && Math.hypot(
          event.global.x - rightPressAt.x,
          event.global.y - rightPressAt.y,
        ) <= PLAN_CONTEXT_MENU_TOLERANCE
      ) {
        emit('context-menu', { x: event.clientX, y: event.clientY });
      }

      rightPressAt = undefined;

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
   * инструментом мебели Ctrl+колесо поворачивает предмет, с лестницей —
   * меняет размер винтовой.
   *
   * @param event Событие колеса.
   */
  function handleWheel(event: WheelEvent): void {
    if (!application) {
      return;
    }

    event.preventDefault();

    if (
      (props.tool === 'furniture' || props.tool === 'stairs')
      && (event.ctrlKey || event.metaKey)
    ) {
      if (
        event.deltaY !== 0
        && event.timeStamp - lastRotateAt > PLAN_WHEEL_ROTATE_MS
      ) {
        lastRotateAt = event.timeStamp;
        emit('wheel-step', event.deltaY > 0 ? 1 : -1);
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
   * Ставит середину этажа в центр холста, не меняя масштаб; на пустом этаже —
   * угол участка.
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
    // resizeTo подгоняет размер только к следующему кадру; без этого на
    // телефоне план центрировался бы по размеру холста по умолчанию.
    application.resize();
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
      props.selection,
      props.facilityColors,
      props.facilityAreas,
      props.preview,
      props.hoverPoint,
      props.cursors,
      props.furnitureKind,
      props.furnitureRotation,
      props.spiralSide,
    ],
    render,
  );

  /** Кнопка «Центрировать»: середина нарисованного — в центр холста. */
  function centerPlan(): void {
    centerView();
    render();
  }

  defineExpose({ centerPlan, zoomStep });
</script>

<template>
  <div
    ref="container"
    class="relative h-full w-full touch-none overflow-hidden rounded-lg border border-default select-none"
    :class="cursor"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  />
</template>
