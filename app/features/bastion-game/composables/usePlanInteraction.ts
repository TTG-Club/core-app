import type { Ref, ShallowRef } from 'vue';

import type {
  CellSide,
  DoorKind,
  FurnitureKind,
  PlanArea,
  PlanCell,
  PlanCircle,
  PlanDocument,
  PlanRoom,
  PlanRoomSeed,
  PlanTool,
  StairKind,
  StairTarget,
} from '../model';

import { fillTemplate } from '~bastions/model';

import {
  addColumn,
  addStair,
  addTower,
  canMoveRoom,
  clearArea,
  drawRoom,
  eraseCells,
  eraseObjectAt,
  findRoomAt,
  getCellAt,
  getLineCells,
  getNextRoomName,
  getRectCells,
  getStairTargetLevel,
  moveRoom,
  paintCorridor,
  paintDefenseWall,
  placeFurniture,
  placeOpening,
  PLAN_FEET_PER_CELL,
  PLAN_LABELS,
  PLAN_LIMITS,
  snapToHalf,
} from '../model';

/** Точка холста в клетках (дробная). */
export interface PlanPoint {
  x: number;
  y: number;
}

/** Что рисуется поверх плана, пока жест не закончен. */
export type PlanPreview =
  | { kind: 'rect'; from: PlanCell; to: PlanCell; label: string | undefined }
  | { kind: 'circle'; circle: PlanCircle; label: string }
  | { kind: 'move'; cells: Array<PlanCell>; isValid: boolean };

interface PlanEditorApi {
  document: ShallowRef<PlanDocument>;
  commit: (next: PlanDocument) => void;
  beginStroke: () => void;
  applyInStroke: (next: PlanDocument) => void;
  endStroke: () => void;
}

interface PlanInteractionOptions {
  editor: PlanEditorApi;
  tool: Ref<PlanTool>;
  level: Ref<number>;
  selectedRoomId: Ref<string | undefined>;
  doorKind: Ref<DoorKind>;
  stairKind: Ref<StairKind>;
  stairTarget: Ref<StairTarget | undefined>;
  stairDirection: Ref<CellSide>;
  corridorWidth: Ref<number>;
  furnitureKind: Ref<FurnitureKind>;
}

/** Жест, который сейчас выполняется указателем. */
type PlanGesture =
  | {
      type: 'room';
      anchor: PlanCell;
      current: PlanCell;
      target: PlanRoom | PlanRoomSeed;
    }
  | { type: 'tower'; center: PlanCell; radius: number }
  | { type: 'move'; room: PlanRoom; anchor: PlanCell; offset: PlanCell }
  | { type: 'stairs'; anchor: PlanCell; current: PlanCell }
  | { type: 'corridor'; last: PlanCell; target: PlanRoom | PlanRoomSeed }
  | { type: 'erase'; last: PlanCell }
  | { type: 'area'; anchor: PlanCell; current: PlanCell }
  | { type: 'wall'; last: PlanCell };

/**
 * Квадрат кисти шириной в несколько клеток от клетки под указателем.
 *
 * @param cell Клетка под указателем.
 * @param width Сторона квадрата в клетках.
 * @returns Клетки кисти.
 */
function getBrushCells(cell: PlanCell, width: number): Array<PlanCell> {
  const cells: Array<PlanCell> = [];

  for (let row = 0; row < width; row++) {
    for (let column = 0; column < width; column++) {
      cells.push({ x: cell.x + column, y: cell.y + row });
    }
  }

  return cells;
}

/**
 * Направление подъёма по протянутой рамке лестницы: вдоль длинной стороны,
 * туда, куда тянули.
 *
 * @param anchor Клетка, где начали тянуть.
 * @param current Клетка, где отпустили.
 * @param fallback Направление, если рамку не тянули.
 * @returns Сторона света.
 */
function getDragDirection(
  anchor: PlanCell,
  current: PlanCell,
  fallback: CellSide,
): CellSide {
  const deltaX = current.x - anchor.x;
  const deltaY = current.y - anchor.y;

  if (deltaX === 0 && deltaY === 0) {
    return fallback;
  }

  if (Math.abs(deltaY) >= Math.abs(deltaX)) {
    return deltaY < 0 ? 'N' : 'S';
  }

  return deltaX < 0 ? 'W' : 'E';
}

/**
 * Подпись размера прямоугольника в футах.
 *
 * @param from Угловая клетка.
 * @param to Противоположная клетка.
 * @returns «20×15 фт.».
 */
function getRectangleLabel(from: PlanCell, to: PlanCell): string {
  return fillTemplate(PLAN_LABELS.rectangleSize, {
    width: (Math.abs(to.x - from.x) + 1) * PLAN_FEET_PER_CELL,
    height: (Math.abs(to.y - from.y) + 1) * PLAN_FEET_PER_CELL,
  });
}

/**
 * Ограничивает рамку лестницы допустимым размером, считая от начала.
 *
 * @param anchor Клетка, где начали тянуть.
 * @param current Текущая клетка.
 * @returns Клетка конца рамки.
 */
function clampStairEnd(anchor: PlanCell, current: PlanCell): PlanCell {
  const limit = PLAN_LIMITS.maxStairSide - 1;

  return {
    x: anchor.x + Math.max(-limit, Math.min(limit, current.x - anchor.x)),
    y: anchor.y + Math.max(-limit, Math.min(limit, current.y - anchor.y)),
  };
}

/**
 * Инструменты редактора плана: что делает нажатие, движение и отпускание
 * указателя для каждого инструмента. Холст сообщает только точки в клетках,
 * вся логика — здесь.
 *
 * @param options Редактор и настройки инструментов.
 * @returns Подсказка поверх плана, точка под указателем и обработчики.
 */
export function usePlanInteraction(options: PlanInteractionOptions) {
  const { editor, tool, level, selectedRoomId } = options;

  const preview = shallowRef<PlanPreview>();
  const hoverPoint = shallowRef<PlanPoint>();

  /** Выделенный участок: остаётся после жеста, пока его не уберут или сбросят. */
  const selectedArea = shallowRef<PlanArea & { level: number }>();

  let gesture: PlanGesture | undefined;

  /**
   * Новая комната: идентификатор, название по виду и текущий этаж.
   *
   * @param kind Вид комнаты — для названия.
   * @returns Заготовка комнаты.
   */
  function createSeed(kind: PlanRoom['kind']): PlanRoomSeed {
    return {
      id: crypto.randomUUID(),
      name: getNextRoomName(editor.document.value, kind),
      level: level.value,
    };
  }

  /**
   * Начало жеста для комнаты: расширить выбранную, если начали в ней, или
   * нарисовать новую.
   *
   * @param cell Клетка, где нажали.
   */
  function startRoom(cell: PlanCell): void {
    const selected = editor.document.value.rooms.find(
      (room) => room.id === selectedRoomId.value,
    );

    const isExtending =
      selected !== undefined
      && selected.level === level.value
      && selected.kind !== 'TOWER'
      && selected.cells.some((item) => item.x === cell.x && item.y === cell.y);

    gesture = {
      type: 'room',
      anchor: cell,
      current: cell,
      target: isExtending ? selected : createSeed('ROOM'),
    };

    preview.value = { kind: 'rect', from: cell, to: cell, label: undefined };
  }

  /**
   * Начало коридора: продолжает коридор под указателем или начинает новый.
   *
   * @param point Точка нажатия.
   * @param cell Клетка нажатия.
   */
  function startCorridor(point: PlanPoint, cell: PlanCell): void {
    const start = findRoomAt(editor.document.value, level.value, point);
    const target = start?.kind === 'CORRIDOR' ? start : createSeed('CORRIDOR');

    editor.beginStroke();
    gesture = { type: 'corridor', last: cell, target };
    paintCorridorAt(cell, target);
  }

  /**
   * Красит коридор кистью текущей ширины.
   *
   * @param cell Клетка под указателем.
   * @param target Коридор или заготовка нового.
   */
  function paintCorridorAt(
    cell: PlanCell,
    target: PlanRoom | PlanRoomSeed,
  ): void {
    editor.applyInStroke(
      paintCorridor(
        editor.document.value,
        getBrushCells(cell, options.corridorWidth.value),
        target,
      ),
    );
  }

  /**
   * Ластик: щелчок по предмету убирает его, иначе начинается мазок по полу.
   *
   * @param point Точка нажатия.
   * @param cell Клетка нажатия.
   */
  function startErase(point: PlanPoint, cell: PlanCell): void {
    const next = eraseObjectAt(editor.document.value, level.value, point);

    if (next !== editor.document.value) {
      editor.commit(next);

      return;
    }

    editor.beginStroke();
    gesture = { type: 'erase', last: cell };

    editor.applyInStroke(
      eraseCells(editor.document.value, level.value, [cell]),
    );
  }

  /**
   * Нажатие указателя на холсте.
   *
   * @param point Точка в клетках.
   */
  function handleDown(point: PlanPoint): void {
    const cell = getCellAt(point);
    const document = editor.document.value;

    switch (tool.value) {
      case 'select': {
        const room = findRoomAt(document, level.value, point);

        selectedRoomId.value = room?.id;

        if (room) {
          gesture = {
            type: 'move',
            room,
            anchor: cell,
            offset: { x: 0, y: 0 },
          };
        }

        break;
      }
      case 'room':
        startRoom(cell);

        break;
      case 'tower': {
        const center = { x: snapToHalf(point.x), y: snapToHalf(point.y) };

        gesture = { type: 'tower', center, radius: PLAN_LIMITS.minTowerRadius };
        updateTowerPreview(center, PLAN_LIMITS.minTowerRadius);

        break;
      }
      case 'corridor':
        startCorridor(point, cell);

        break;
      case 'eraser':
        startErase(point, cell);

        break;
      case 'wall':
        if (level.value === 0) {
          editor.beginStroke();
          gesture = { type: 'wall', last: cell };
          editor.applyInStroke(paintDefenseWall(document, [cell]));
        }

        break;
      case 'stairs':
        gesture = { type: 'stairs', anchor: cell, current: cell };

        preview.value = {
          kind: 'rect',
          from: cell,
          to: cell,
          label: undefined,
        };

        break;
      case 'door':
        editor.commit(
          placeOpening(document, level.value, point, {
            type: 'DOOR',
            kind: options.doorKind.value,
          }),
        );

        break;
      case 'window':
        editor.commit(
          placeOpening(document, level.value, point, { type: 'WINDOW' }),
        );

        break;
      case 'column':
        editor.commit(
          addColumn(document, {
            id: crypto.randomUUID(),
            level: level.value,
            x: snapToHalf(point.x),
            y: snapToHalf(point.y),
          }),
        );

        break;
      case 'furniture':
        editor.commit(
          placeFurniture(
            document,
            level.value,
            point,
            options.furnitureKind.value,
          ),
        );

        break;
      case 'area':
        selectedArea.value = undefined;
        gesture = { type: 'area', anchor: cell, current: cell };

        preview.value = {
          kind: 'rect',
          from: cell,
          to: cell,
          label: undefined,
        };

        break;
      case 'pan':
        break;
    }
  }

  /**
   * Подсказка круглой башни: окружность и диаметр в футах.
   *
   * @param center Центр.
   * @param radius Радиус в клетках.
   */
  function updateTowerPreview(center: PlanCell, radius: number): void {
    preview.value = {
      kind: 'circle',
      circle: { cx: center.x, cy: center.y, r: radius },
      label: fillTemplate(PLAN_LABELS.feet, {
        feet: radius * 2 * PLAN_FEET_PER_CELL,
      }),
    };
  }

  /**
   * Движение указателя: обновляет подсказку или продолжает мазок.
   *
   * @param point Точка в клетках.
   */
  function handleMove(point: PlanPoint): void {
    hoverPoint.value = point;

    if (!gesture) {
      return;
    }

    const cell = getCellAt(point);

    switch (gesture.type) {
      case 'room':
        gesture.current = cell;

        preview.value = {
          kind: 'rect',
          from: gesture.anchor,
          to: cell,
          label: getRectangleLabel(gesture.anchor, cell),
        };

        break;
      case 'tower': {
        const distance = Math.hypot(
          point.x - gesture.center.x,
          point.y - gesture.center.y,
        );

        gesture.radius = Math.min(
          PLAN_LIMITS.maxTowerRadius,
          Math.max(PLAN_LIMITS.minTowerRadius, snapToHalf(distance)),
        );

        updateTowerPreview(gesture.center, gesture.radius);

        break;
      }
      case 'move': {
        const offset = {
          x: cell.x - gesture.anchor.x,
          y: cell.y - gesture.anchor.y,
        };

        const { room } = gesture;

        gesture.offset = offset;

        preview.value = {
          kind: 'move',
          cells: room.cells.map((item) => ({
            x: item.x + offset.x,
            y: item.y + offset.y,
          })),
          isValid: canMoveRoom(editor.document.value, room, offset),
        };

        break;
      }
      case 'area':
        gesture.current = cell;

        preview.value = {
          kind: 'rect',
          from: gesture.anchor,
          to: cell,
          label: getRectangleLabel(gesture.anchor, cell),
        };

        break;
      case 'stairs':
        gesture.current = clampStairEnd(gesture.anchor, cell);

        preview.value = {
          kind: 'rect',
          from: gesture.anchor,
          to: gesture.current,
          label: getRectangleLabel(gesture.anchor, gesture.current),
        };

        break;
      case 'corridor': {
        const { target } = gesture;

        for (const lineCell of getLineCells(gesture.last, cell)) {
          paintCorridorAt(lineCell, target);
        }

        gesture.last = cell;

        break;
      }
      case 'erase':
        editor.applyInStroke(
          eraseCells(
            editor.document.value,
            level.value,
            getLineCells(gesture.last, cell),
          ),
        );

        gesture.last = cell;

        break;
      case 'wall':
        editor.applyInStroke(
          paintDefenseWall(
            editor.document.value,
            getLineCells(gesture.last, cell),
          ),
        );

        gesture.last = cell;

        break;
    }
  }

  /** Отпускание указателя: завершает жест одним шагом истории. */
  function handleUp(): void {
    const finished = gesture;

    gesture = undefined;
    preview.value = undefined;

    if (!finished) {
      return;
    }

    const document = editor.document.value;

    switch (finished.type) {
      case 'room':
        editor.commit(
          drawRoom(
            document,
            getRectCells(finished.anchor, finished.current),
            finished.target,
          ),
        );

        selectedRoomId.value = finished.target.id;

        break;
      case 'tower': {
        const seed = createSeed('TOWER');
        const { center, radius } = finished;

        editor.commit(
          addTower(document, seed, { cx: center.x, cy: center.y, r: radius }),
        );

        selectedRoomId.value = seed.id;

        break;
      }
      case 'move':
        editor.commit(moveRoom(document, finished.room.id, finished.offset));

        break;
      case 'stairs':
        finishStairs(finished.anchor, finished.current);

        break;
      case 'area':
        selectedArea.value = {
          level: level.value,
          from: finished.anchor,
          to: finished.current,
        };

        break;
      case 'corridor':
      case 'erase':
      case 'wall':
        editor.endStroke();

        if (finished.type === 'corridor') {
          selectedRoomId.value = finished.target.id;
        }

        break;
    }
  }

  /**
   * Ставит лестницу по рамке. Если вести некуда — ничего не делает: панель
   * инструмента уже подсказывает добавить этаж.
   *
   * @param anchor Клетка, где начали тянуть.
   * @param current Клетка, где отпустили.
   */
  function finishStairs(anchor: PlanCell, current: PlanCell): void {
    const toLevel = getStairTargetLevel(
      editor.document.value,
      level.value,
      options.stairTarget.value,
    );

    if (toLevel === undefined) {
      return;
    }

    editor.commit(
      addStair(editor.document.value, {
        id: crypto.randomUUID(),
        level: level.value,
        x: Math.min(anchor.x, current.x),
        y: Math.min(anchor.y, current.y),
        width: Math.abs(current.x - anchor.x) + 1,
        height: Math.abs(current.y - anchor.y) + 1,
        direction: getDragDirection(
          anchor,
          current,
          options.stairDirection.value,
        ),
        toLevel,
        kind: options.stairKind.value,
      }),
    );
  }

  /** Указатель ушёл с холста. */
  function handleLeave(): void {
    hoverPoint.value = undefined;
  }

  /**
   * Убирает всё на выделенном участке одним шагом истории и снимает
   * выделение.
   */
  function clearSelectedArea(): void {
    const area = selectedArea.value;

    if (!area) {
      return;
    }

    editor.commit(clearArea(editor.document.value, area.level, area));
    selectedArea.value = undefined;
  }

  /** Прерывает жест без изменений (Escape) и снимает выделение участка. */
  function cancel(): void {
    selectedArea.value = undefined;

    if (gesture && ['corridor', 'erase', 'wall'].includes(gesture.type)) {
      editor.endStroke();
    }

    gesture = undefined;
    preview.value = undefined;
  }

  return {
    preview,
    hoverPoint,
    selectedArea,
    clearSelectedArea,
    handleDown,
    handleMove,
    handleUp,
    handleLeave,
    cancel,
  };
}
