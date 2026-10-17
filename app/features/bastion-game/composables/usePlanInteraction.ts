import type { Ref, ShallowRef } from 'vue';

import type {
  CellSide,
  DoorKind,
  FurnitureKind,
  PlanCell,
  PlanCircle,
  PlanDocument,
  PlanFurniture,
  PlanObjectRef,
  PlanRoom,
  PlanRoomSeed,
  PlanSelection,
  PlanTool,
  StairKind,
  StairTarget,
  TowerShape,
} from '../model';

import { fillTemplate } from '~bastions/model';

import {
  addColumn,
  addSquareTower,
  addStair,
  addToSelection,
  addTower,
  canMoveObjects,
  drawRoom,
  eraseCells,
  eraseObjectAt,
  findFurnitureAt,
  findObjectAt,
  findRoomAt,
  getCellAt,
  getFurnitureSize,
  getLineCells,
  getNextRoomName,
  getObjectsInArea,
  getRectCells,
  getSelectionCells,
  getSquareCorner,
  getStairTargetLevel,
  getTowerStairFrame,
  isDefenseGate,
  isDefenseWallCell,
  isFurnitureOnGrid,
  isObjectSelected,
  isPremiumFurniture,
  isTowerKind,
  moveFurniture,
  moveObjects,
  paintCorridor,
  paintDefenseGates,
  paintDefenseWall,
  placeFurniture,
  placeOpening,
  placeTowerStair,
  PLAN_FEET_PER_CELL,
  PLAN_LABELS,
  PLAN_LIMITS,
  rotateFurniture,
  snapToHalf,
  toggleObject,
  TOWER_SHAPE_SIDES,
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
  /** У владельца бастиона подписка: можно ставить предметы по подписке. */
  isPremium: Readonly<Ref<boolean>>;
  commit: (next: PlanDocument) => void;
  beginStroke: () => void;
  applyInStroke: (next: PlanDocument) => void;
  endStroke: () => void;
}

interface PlanInteractionOptions {
  editor: PlanEditorApi;
  tool: Ref<PlanTool>;
  level: Ref<number>;
  /** Выбранные объекты плана. */
  selection: Ref<PlanSelection>;
  /** Единственная выбранная комната; запись заменяет выбор этой комнатой. */
  selectedRoomId: Ref<string | undefined>;
  doorKind: Ref<DoorKind>;
  stairKind: Ref<StairKind>;
  stairTarget: Ref<StairTarget | undefined>;
  stairDirection: Ref<CellSide>;
  /** Заданная сторона винтовой лестницы; undefined — наибольшая. */
  spiralSide: Ref<number | undefined>;
  towerShape: Ref<TowerShape>;
  corridorWidth: Ref<number>;
  furnitureKind: Ref<FurnitureKind>;
  furnitureRotation: Ref<number>;
  /** Сколько блоков защитной стены можно поставить; undefined — без ограничения. */
  wallLimit: Ref<number | undefined>;
}

/** Жест, который сейчас выполняется указателем. */
type PlanGesture =
  | {
      type: 'room';
      anchor: PlanCell;
      current: PlanCell;
      target: PlanRoom | PlanRoomSeed;
    }
  | {
      type: 'tower';
      center: PlanCell;
      radius: number;
      /** Число сторон многоугольной башни; у круглой нет. */
      sides: number | undefined;
    }
  | { type: 'squareTower'; anchor: PlanCell; current: PlanCell }
  | {
      type: 'move';
      /** Что тянут: весь выбор на момент нажатия. */
      selection: PlanSelection;
      /** Объект, за который взяли: щелчок без сдвига оставляет только его. */
      target: PlanObjectRef;
      anchor: PlanCell;
      offset: PlanCell;
    }
  | {
      type: 'frame';
      anchor: PlanCell;
      current: PlanCell;
      /** Выбор до рамки: с Shift рамка добавляет к нему. */
      base: PlanSelection;
    }
  | {
      type: 'furniture';
      item: PlanFurniture;
      anchor: PlanCell;
      offset: PlanCell;
      /** Щелчок без сдвига поворачивает предмет (инструмент «Мебель»). */
      rotateOnClick: boolean;
    }
  | { type: 'stairs'; anchor: PlanCell; current: PlanCell }
  | { type: 'corridor'; last: PlanCell; target: PlanRoom | PlanRoomSeed }
  | { type: 'erase'; last: PlanCell }
  | {
      type: 'wall';
      last: PlanCell;
      /** Что делает мазок: строит стену, ставит или убирает ворота. */
      paint: (document: PlanDocument, cells: Array<PlanCell>) => PlanDocument;
    };

/** Жест башни, которую тянут от центра. */
type TowerGesture = Extract<PlanGesture, { type: 'tower' }>;

/**
 * Окружность башни по жесту: у многоугольной — с числом сторон.
 *
 * @param tower Жест башни.
 * @returns Окружность.
 */
function getGestureCircle(tower: TowerGesture): PlanCircle {
  const circle = { cx: tower.center.x, cy: tower.center.y, r: tower.radius };

  return tower.sides ? { ...circle, sides: tower.sides } : circle;
}

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
  const { editor, tool, level, selection, selectedRoomId } = options;

  const preview = shallowRef<PlanPreview>();
  const hoverPoint = shallowRef<PlanPoint>();

  let gesture: PlanGesture | undefined;

  /**
   * Мазок защитной стены в пределах купленных блоков.
   *
   * @param next План.
   * @param cells Клетки мазка.
   * @returns Правка для клеток мазка.
   */
  function paintWall(next: PlanDocument, cells: Array<PlanCell>): PlanDocument {
    return paintDefenseWall(next, cells, options.wallLimit.value);
  }

  /**
   * Мазок ворот: начатый на воротах закладывает проёмы стеной, иначе ставит
   * ворота в стену.
   *
   * @param document План в начале мазка.
   * @param cell Клетка, где начали вести.
   * @returns Правка для клеток мазка.
   */
  function getGatePaint(
    document: PlanDocument,
    cell: PlanCell,
  ): (next: PlanDocument, cells: Array<PlanCell>) => PlanDocument {
    const isGate = !isDefenseGate(document, cell);

    return (next, cells) => paintDefenseGates(next, cells, isGate);
  }

  /**
   * Начинает перетаскивание стоящего предмета мебели.
   *
   * @param item Предмет.
   * @param cell Клетка, за которую взяли.
   * @param rotateOnClick Поворачивать ли предмет, если его не сдвинули.
   */
  function startFurnitureMove(
    item: PlanFurniture,
    cell: PlanCell,
    rotateOnClick: boolean,
  ): void {
    gesture = {
      type: 'furniture',
      item,
      anchor: cell,
      offset: { x: 0, y: 0 },
      rotateOnClick,
    };
  }

  /**
   * Нажатие инструментом «Выбрать»: щелчок выбирает объект и начинает
   * перетаскивание всего выбора, Shift+щелчок добавляет объект к выбору или
   * убирает из него, нажатие на пустом месте начинает рамку.
   *
   * @param point Точка нажатия.
   * @param cell Клетка нажатия.
   * @param isAdditive Зажат ли Shift (или Ctrl).
   */
  function startSelect(
    point: PlanPoint,
    cell: PlanCell,
    isAdditive: boolean,
  ): void {
    const target = findObjectAt(editor.document.value, level.value, point);

    if (!target) {
      if (!isAdditive) {
        selection.value = [];
      }

      gesture = {
        type: 'frame',
        anchor: cell,
        current: cell,
        base: selection.value,
      };

      preview.value = { kind: 'rect', from: cell, to: cell, label: undefined };

      return;
    }

    if (isAdditive) {
      selection.value = toggleObject(selection.value, target);

      return;
    }

    if (!isObjectSelected(selection.value, target)) {
      selection.value = [target];
    }

    gesture = {
      type: 'move',
      selection: selection.value,
      target,
      anchor: cell,
      offset: { x: 0, y: 0 },
    };
  }

  /**
   * Новая комната: идентификатор, название по виду и текущий этаж.
   *
   * @param kind Вид комнаты — для названия.
   * @param shape Форма башни — для названия.
   * @returns Заготовка комнаты.
   */
  function createSeed(
    kind: PlanRoom['kind'],
    shape?: TowerShape,
  ): PlanRoomSeed {
    return {
      id: crypto.randomUUID(),
      name: getNextRoomName(editor.document.value, kind, shape),
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
      && !isTowerKind(selected.kind)
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
   * @param isAdditive Зажат ли Shift (или Ctrl): добавить к выбору.
   */
  function handleDown(point: PlanPoint, isAdditive = false): void {
    const cell = getCellAt(point);
    const document = editor.document.value;

    switch (tool.value) {
      case 'select':
        startSelect(point, cell, isAdditive);

        break;
      case 'room':
        startRoom(cell);

        break;
      case 'tower': {
        if (options.towerShape.value === 'SQUARE') {
          startSquareTower(cell);

          break;
        }

        const center = { x: snapToHalf(point.x), y: snapToHalf(point.y) };

        gesture = {
          type: 'tower',
          center,
          radius: PLAN_LIMITS.minTowerRadius,
          sides: TOWER_SHAPE_SIDES[options.towerShape.value],
        };

        updateTowerPreview(gesture);

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
          gesture = { type: 'wall', last: cell, paint: paintWall };
          editor.applyInStroke(paintWall(document, [cell]));
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
        // Дверь в защитной стене — ворота: их можно протянуть на несколько клеток.
        if (level.value === 0 && isDefenseWallCell(document, cell)) {
          const paint = getGatePaint(document, cell);

          editor.beginStroke();
          gesture = { type: 'wall', last: cell, paint };
          editor.applyInStroke(paint(document, [cell]));

          break;
        }

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
      case 'furniture': {
        const item = findFurnitureAt(document, level.value, point);

        if (item) {
          startFurnitureMove(item, cell, true);

          break;
        }

        // Предмет по подписке ставит только бастион владельца с подпиской.
        if (
          isPremiumFurniture(options.furnitureKind.value)
          && !editor.isPremium.value
        ) {
          break;
        }

        editor.commit(
          placeFurniture(
            document,
            level.value,
            point,
            options.furnitureKind.value,
            options.furnitureRotation.value,
          ),
        );

        break;
      }
      case 'pan':
        break;
    }
  }

  /**
   * Подсказка башни: окружность или многоугольник и поперечник в футах.
   *
   * @param tower Жест башни.
   */
  function updateTowerPreview(tower: TowerGesture): void {
    preview.value = {
      kind: 'circle',
      circle: getGestureCircle(tower),
      label: fillTemplate(PLAN_LABELS.feet, {
        feet: tower.radius * 2 * PLAN_FEET_PER_CELL,
      }),
    };
  }

  /**
   * Подсказка квадратной башни: рамка и её размер в футах.
   *
   * @param from Угол, откуда тянут.
   * @param to Противоположный угол.
   */
  function updateSquareTowerPreview(from: PlanCell, to: PlanCell): void {
    preview.value = {
      kind: 'rect',
      from,
      to,
      label: getRectangleLabel(from, to),
    };
  }

  /**
   * Начало квадратной башни: квадрат наименьшего размера от клетки нажатия.
   *
   * @param cell Клетка нажатия.
   */
  function startSquareTower(cell: PlanCell): void {
    const current = getSquareCorner(cell, cell);

    gesture = { type: 'squareTower', anchor: cell, current };
    updateSquareTowerPreview(cell, current);
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

        updateTowerPreview(gesture);

        break;
      }
      case 'squareTower':
        gesture.current = getSquareCorner(gesture.anchor, cell);
        updateSquareTowerPreview(gesture.anchor, gesture.current);

        break;
      case 'furniture': {
        const offset = {
          x: cell.x - gesture.anchor.x,
          y: cell.y - gesture.anchor.y,
        };

        const { item } = gesture;
        const moved = { ...item, x: item.x + offset.x, y: item.y + offset.y };
        const { width, depth } = getFurnitureSize(moved);

        gesture.offset = offset;

        preview.value = {
          kind: 'move',
          cells: getRectCells(moved, {
            x: moved.x + width - 1,
            y: moved.y + depth - 1,
          }),
          isValid: isFurnitureOnGrid(moved),
        };

        break;
      }
      case 'move': {
        const offset = {
          x: cell.x - gesture.anchor.x,
          y: cell.y - gesture.anchor.y,
        };

        const document = editor.document.value;

        gesture.offset = offset;

        preview.value = {
          kind: 'move',
          cells: getSelectionCells(document, gesture.selection).map((item) => ({
            x: item.x + offset.x,
            y: item.y + offset.y,
          })),
          isValid: canMoveObjects(document, gesture.selection, offset),
        };

        break;
      }
      case 'frame':
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
          gesture.paint(
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
        const seed = createSeed('TOWER', options.towerShape.value);

        editor.commit(addTower(document, seed, getGestureCircle(finished)));

        selectedRoomId.value = seed.id;

        break;
      }
      case 'squareTower': {
        const seed = createSeed('SQUARE_TOWER', 'SQUARE');

        editor.commit(
          addSquareTower(
            document,
            seed,
            getRectCells(finished.anchor, finished.current),
          ),
        );

        selectedRoomId.value = seed.id;

        break;
      }
      case 'move': {
        const { offset } = finished;

        if (offset.x === 0 && offset.y === 0) {
          selection.value = [finished.target];
        } else {
          editor.commit(moveObjects(document, finished.selection, offset));
        }

        break;
      }
      case 'frame':
        selection.value = addToSelection(
          finished.base,
          getObjectsInArea(document, level.value, {
            from: finished.anchor,
            to: finished.current,
          }),
        );

        break;
      case 'furniture': {
        const { item, offset } = finished;
        const isClick = offset.x === 0 && offset.y === 0;

        if (isClick && finished.rotateOnClick) {
          editor.commit(rotateFurniture(document, item.id));
        } else if (!isClick) {
          editor.commit(moveFurniture(document, item.id, offset));
        }

        break;
      }
      case 'stairs':
        finishStairs(finished.anchor, finished.current);

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

    const isClick = anchor.x === current.x && anchor.y === current.y;

    const tower = isClick
      ? getTowerStairFrame(editor.document.value, level.value, anchor)
      : undefined;

    if (tower) {
      editor.commit(
        placeTowerStair(
          editor.document.value,
          level.value,
          anchor,
          {
            id: crypto.randomUUID(),
            toLevel,
            direction: options.stairDirection.value,
          },
          options.spiralSide.value,
        ),
      );

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

  /** Прерывает жест без изменений (Escape). */
  function cancel(): void {
    if (gesture && ['corridor', 'erase', 'wall'].includes(gesture.type)) {
      editor.endStroke();
    }

    gesture = undefined;
    preview.value = undefined;
  }

  return {
    preview,
    hoverPoint,
    handleDown,
    handleMove,
    handleUp,
    handleLeave,
    cancel,
  };
}
