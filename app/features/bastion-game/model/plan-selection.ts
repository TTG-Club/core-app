import type { PlanArea } from './plan-edit';
import type { PlanCell, PlanDocument, PlanEdge, PlanRoom } from './plan-schema';

import { PLAN_LIMITS } from './plan-constants';
import {
  findColumnAt,
  findFurnitureAt,
  findRoomAt,
  findStairAt,
  prunePlan,
} from './plan-edit';
import {
  getCellAt,
  getCellKey,
  getEdgeCells,
  getFurnitureSize,
  getOccupancy,
  getRectCells,
  isCellOnGrid,
  isFurnitureOnGrid,
  isTowerKind,
} from './plan-geometry';

/** Виды объектов плана, которые выбирает инструмент «Выбрать». */
export const PLAN_OBJECT_KINDS = [
  'room',
  'furniture',
  'stair',
  'column',
] as const;

export type PlanObjectKind = (typeof PLAN_OBJECT_KINDS)[number];

/** Выбранный объект плана: вид и идентификатор. */
export interface PlanObjectRef {
  kind: PlanObjectKind;
  id: string;
}

/** Выбранные объекты в порядке выбора: первый — главный. */
export type PlanSelection = ReadonlyArray<PlanObjectRef>;

/**
 * Один ли это объект.
 *
 * @param first Первый объект.
 * @param second Второй объект.
 * @returns true, если вид и идентификатор совпадают.
 */
function isSameObject(first: PlanObjectRef, second: PlanObjectRef): boolean {
  return first.kind === second.kind && first.id === second.id;
}

/**
 * Выбран ли объект.
 *
 * @param selection Выбор.
 * @param target Объект.
 * @returns true, если объект в выборе.
 */
export function isObjectSelected(
  selection: PlanSelection,
  target: PlanObjectRef,
): boolean {
  return selection.some((item) => isSameObject(item, target));
}

/**
 * Добавляет объект в выбор или убирает его, если он уже выбран (щелчок с
 * Shift).
 *
 * @param selection Выбор.
 * @param target Объект.
 * @returns Новый выбор.
 */
export function toggleObject(
  selection: PlanSelection,
  target: PlanObjectRef,
): PlanSelection {
  return isObjectSelected(selection, target)
    ? selection.filter((item) => !isSameObject(item, target))
    : [...selection, target];
}

/**
 * Объединяет выбор с новыми объектами без повторов.
 *
 * @param selection Выбор.
 * @param added Объекты, которые добавить.
 * @returns Новый выбор.
 */
export function addToSelection(
  selection: PlanSelection,
  added: PlanSelection,
): PlanSelection {
  const fresh = added.filter((item) => !isObjectSelected(selection, item));

  return fresh.length ? [...selection, ...fresh] : selection;
}

/**
 * Идентификаторы выбранных объектов одного вида.
 *
 * @param selection Выбор.
 * @param kind Вид объектов.
 * @returns Идентификаторы.
 */
export function getSelectedIds(
  selection: PlanSelection,
  kind: PlanObjectKind,
): Set<string> {
  return new Set(
    selection.filter((item) => item.kind === kind).map((item) => item.id),
  );
}

/**
 * Выбранные комнаты в порядке выбора.
 *
 * @param document План.
 * @param selection Выбор.
 * @returns Комнаты, что есть в плане.
 */
export function getSelectedRooms(
  document: PlanDocument,
  selection: PlanSelection,
): Array<PlanRoom> {
  const rooms = new Map(document.rooms.map((room) => [room.id, room]));

  return selection.flatMap((item) => {
    const room = item.kind === 'room' ? rooms.get(item.id) : undefined;

    return room ? [room] : [];
  });
}

/**
 * Этаж объекта, если он есть в плане.
 *
 * @param document План.
 * @param target Объект.
 * @returns Этаж или undefined, если объекта больше нет.
 */
function getObjectLevel(
  document: PlanDocument,
  target: PlanObjectRef,
): number | undefined {
  const collections: Record<
    PlanObjectKind,
    ReadonlyArray<{ id: string; level: number }>
  > = {
    room: document.rooms,
    furniture: document.furniture,
    stair: document.stairs,
    column: document.columns,
  };

  return collections[target.kind].find((item) => item.id === target.id)?.level;
}

/**
 * Убирает из выбора объекты, которых больше нет или которые не на этом
 * этаже: их удалили, отменили или сменили этаж.
 *
 * @param document План.
 * @param selection Выбор.
 * @param level Текущий этаж.
 * @returns Тот же выбор, если ничего не ушло, иначе новый.
 */
export function pruneSelection(
  document: PlanDocument,
  selection: PlanSelection,
  level: number,
): PlanSelection {
  const kept = selection.filter(
    (item) => getObjectLevel(document, item) === level,
  );

  return kept.length === selection.length ? selection : kept;
}

/**
 * Объект под точкой: колонна, предмет интерьера, лестница или комната — в
 * таком порядке, мелкое поверх крупного.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @returns Объект или undefined.
 */
export function findObjectAt(
  document: PlanDocument,
  level: number,
  point: PlanCell,
): PlanObjectRef | undefined {
  const column = findColumnAt(document, level, point);

  if (column) {
    return { kind: 'column', id: column.id };
  }

  const furniture = findFurnitureAt(document, level, point);

  if (furniture) {
    return { kind: 'furniture', id: furniture.id };
  }

  const stair = findStairAt(document, level, point);

  if (stair) {
    return { kind: 'stair', id: stair.id };
  }

  const room = findRoomAt(document, level, point);

  return room ? { kind: 'room', id: room.id } : undefined;
}

/**
 * Объекты этажа, что целиком лежат в рамке.
 *
 * @param document План.
 * @param level Этаж.
 * @param area Рамка в клетках.
 * @returns Объекты в порядке: комнаты, лестницы, предметы, колонны.
 */
export function getObjectsInArea(
  document: PlanDocument,
  level: number,
  area: PlanArea,
): PlanSelection {
  const left = Math.min(area.from.x, area.to.x);
  const right = Math.max(area.from.x, area.to.x);
  const top = Math.min(area.from.y, area.to.y);
  const bottom = Math.max(area.from.y, area.to.y);

  const isInside = (cell: PlanCell) =>
    cell.x >= left && cell.x <= right && cell.y >= top && cell.y <= bottom;

  // Колонны стоят и на линиях сетки: правый и нижний край рамки — граница
  // последней клетки.
  const isPointInside = (point: PlanCell) =>
    point.x >= left
    && point.x <= right + 1
    && point.y >= top
    && point.y <= bottom + 1;

  const isRectInside = (cell: PlanCell, width: number, depth: number) =>
    isInside(cell)
    && isInside({ x: cell.x + width - 1, y: cell.y + depth - 1 });

  const rooms = document.rooms
    .filter(
      (room) =>
        room.level === level
        && room.cells.length > 0
        && room.cells.every(isInside),
    )
    .map((room): PlanObjectRef => ({ kind: 'room', id: room.id }));

  const stairs = document.stairs
    .filter(
      (stair) =>
        stair.level === level && isRectInside(stair, stair.width, stair.height),
    )
    .map((stair): PlanObjectRef => ({ kind: 'stair', id: stair.id }));

  const furniture = document.furniture
    .filter((item) => {
      const { width, depth } = getFurnitureSize(item);

      return item.level === level && isRectInside(item, width, depth);
    })
    .map((item): PlanObjectRef => ({ kind: 'furniture', id: item.id }));

  const columns = document.columns
    .filter((column) => column.level === level && isPointInside(column))
    .map((column): PlanObjectRef => ({ kind: 'column', id: column.id }));

  return [...rooms, ...stairs, ...furniture, ...columns];
}

/**
 * Клетки, которые занимают выбранные объекты, — для подсказки при
 * перетаскивании.
 *
 * @param document План.
 * @param selection Выбор.
 * @returns Клетки.
 */
export function getSelectionCells(
  document: PlanDocument,
  selection: PlanSelection,
): Array<PlanCell> {
  const roomIds = getSelectedIds(selection, 'room');
  const stairIds = getSelectedIds(selection, 'stair');
  const furnitureIds = getSelectedIds(selection, 'furniture');
  const columnIds = getSelectedIds(selection, 'column');

  const roomCells = document.rooms
    .filter((room) => roomIds.has(room.id))
    .flatMap((room) => room.cells);

  const stairCells = document.stairs
    .filter((stair) => stairIds.has(stair.id))
    .flatMap((stair) =>
      getRectCells(stair, {
        x: stair.x + stair.width - 1,
        y: stair.y + stair.height - 1,
      }),
    );

  const furnitureCells = document.furniture
    .filter((item) => furnitureIds.has(item.id))
    .flatMap((item) => {
      const { width, depth } = getFurnitureSize(item);

      return getRectCells(item, {
        x: item.x + width - 1,
        y: item.y + depth - 1,
      });
    });

  const columnCells = document.columns
    .filter((column) => columnIds.has(column.id))
    .map((column) => getCellAt(column));

  return [...roomCells, ...stairCells, ...furnitureCells, ...columnCells];
}

/**
 * Точка (колонна) внутри участка: стоит и на дальних линиях сетки.
 *
 * @param point Точка в клетках.
 * @returns true, если точка на участке.
 */
function isPointOnGrid(point: PlanCell): boolean {
  return (
    point.x >= 0
    && point.y >= 0
    && point.x <= PLAN_LIMITS.gridSize
    && point.y <= PLAN_LIMITS.gridSize
  );
}

/**
 * Сдвигает точку на смещение.
 *
 * @param item Объект с координатами.
 * @param offset Сдвиг в клетках.
 * @returns Сдвинутый объект.
 */
function shiftItem<T extends PlanCell>(item: T, offset: PlanCell): T {
  return { ...item, x: item.x + offset.x, y: item.y + offset.y };
}

/**
 * Можно ли сдвинуть выбранные объекты: комнаты не наезжают на невыбранные
 * комнаты, и ничто не уходит за участок.
 *
 * @param document План.
 * @param selection Выбор.
 * @param offset Сдвиг в клетках.
 * @returns true, если можно.
 */
export function canMoveObjects(
  document: PlanDocument,
  selection: PlanSelection,
  offset: PlanCell,
): boolean {
  const roomIds = getSelectedIds(selection, 'room');
  const stairIds = getSelectedIds(selection, 'stair');
  const furnitureIds = getSelectedIds(selection, 'furniture');
  const columnIds = getSelectedIds(selection, 'column');
  const rooms = document.rooms.filter((room) => roomIds.has(room.id));

  const occupancies = new Map(
    [...new Set(rooms.map((room) => room.level))].map((level) => [
      level,
      getOccupancy(document, level),
    ]),
  );

  const areRoomsFree = rooms.every((room) =>
    room.cells.every((cell) => {
      const moved = shiftItem(cell, offset);

      const owner = occupancies
        .get(room.level)
        ?.get(getCellKey(moved.x, moved.y));

      return isCellOnGrid(moved) && (!owner || roomIds.has(owner.id));
    }),
  );

  return (
    areRoomsFree
    && document.stairs
      .filter((stair) => stairIds.has(stair.id))
      .every((stair) => {
        const moved = shiftItem(stair, offset);

        return (
          isCellOnGrid(moved)
          && isCellOnGrid({
            x: moved.x + moved.width - 1,
            y: moved.y + moved.height - 1,
          })
        );
      })
    && document.furniture
      .filter((item) => furnitureIds.has(item.id))
      .every((item) => isFurnitureOnGrid(shiftItem(item, offset)))
    && document.columns
      .filter((column) => columnIds.has(column.id))
      .every((column) => isPointOnGrid(shiftItem(column, offset)))
  );
}

/**
 * Сдвигает выбранные объекты разом. Комнаты едут вместе со своими дверями,
 * окнами, лестницами, колоннами и предметами интерьера; каждый объект
 * сдвигается один раз, даже если выбран и сам, и его комната.
 *
 * @param document План.
 * @param selection Выбор.
 * @param offset Сдвиг в клетках.
 * @returns Новый план или тот же, если сдвиг невозможен.
 */
export function moveObjects(
  document: PlanDocument,
  selection: PlanSelection,
  offset: PlanCell,
): PlanDocument {
  if (
    selection.length === 0
    || (offset.x === 0 && offset.y === 0)
    || !canMoveObjects(document, selection, offset)
  ) {
    return document;
  }

  const roomIds = getSelectedIds(selection, 'room');
  const stairIds = getSelectedIds(selection, 'stair');
  const furnitureIds = getSelectedIds(selection, 'furniture');
  const columnIds = getSelectedIds(selection, 'column');

  const own = new Set(
    document.rooms
      .filter((room) => roomIds.has(room.id))
      .flatMap((room) =>
        room.cells.map((cell) => `${room.level}:${getCellKey(cell.x, cell.y)}`),
      ),
  );

  const isOwn = (level: number, cell: PlanCell) =>
    own.has(`${level}:${getCellKey(cell.x, cell.y)}`);

  const isOnEdge = (edge: PlanEdge) =>
    getEdgeCells(edge).some((cell) => isOwn(edge.level, cell));

  const moveRoomShape = (room: PlanRoom): PlanRoom => ({
    ...room,
    cells: room.cells.map((cell) => shiftItem(cell, offset)),
    shape: room.shape
      ? {
          ...room.shape,
          cx: room.shape.cx + offset.x,
          cy: room.shape.cy + offset.y,
        }
      : undefined,
  });

  return prunePlan({
    ...document,
    rooms: document.rooms.map((room) =>
      roomIds.has(room.id) ? moveRoomShape(room) : room,
    ),
    doors: document.doors.map((door) =>
      isOnEdge(door) ? shiftItem(door, offset) : door,
    ),
    windows: document.windows.map((item) =>
      isOnEdge(item) ? shiftItem(item, offset) : item,
    ),
    stairs: document.stairs.map((stair) =>
      stairIds.has(stair.id) || isOwn(stair.level, stair)
        ? shiftItem(stair, offset)
        : stair,
    ),
    columns: document.columns.map((column) =>
      columnIds.has(column.id) || isOwn(column.level, getCellAt(column))
        ? shiftItem(column, offset)
        : column,
    ),
    furniture: document.furniture.map((item) =>
      furnitureIds.has(item.id) || isOwn(item.level, item)
        ? shiftItem(item, offset)
        : item,
    ),
  });
}

/**
 * Можно ли сдвинуть комнату: на новом месте нет чужих клеток и она не уходит
 * за участок.
 *
 * @param document План.
 * @param room Комната.
 * @param offset Сдвиг в клетках.
 * @returns true, если можно.
 */
export function canMoveRoom(
  document: PlanDocument,
  room: PlanRoom,
  offset: PlanCell,
): boolean {
  return canMoveObjects(document, [{ kind: 'room', id: room.id }], offset);
}

/**
 * Сдвигает комнату вместе с её дверями, окнами, лестницами и колоннами.
 *
 * @param document План.
 * @param roomId Комната.
 * @param offset Сдвиг в клетках.
 * @returns Новый план или тот же, если сдвиг невозможен.
 */
export function moveRoom(
  document: PlanDocument,
  roomId: string,
  offset: PlanCell,
): PlanDocument {
  return document.rooms.some((room) => room.id === roomId)
    ? moveObjects(document, [{ kind: 'room', id: roomId }], offset)
    : document;
}

/**
 * Удаляет выбранные объекты одним шагом.
 *
 * @param document План.
 * @param selection Выбор.
 * @returns Новый план или тот же, если выбор пуст.
 */
export function removeObjects(
  document: PlanDocument,
  selection: PlanSelection,
): PlanDocument {
  if (selection.length === 0) {
    return document;
  }

  const roomIds = getSelectedIds(selection, 'room');
  const stairIds = getSelectedIds(selection, 'stair');
  const furnitureIds = getSelectedIds(selection, 'furniture');
  const columnIds = getSelectedIds(selection, 'column');

  return prunePlan({
    ...document,
    rooms: document.rooms.filter((room) => !roomIds.has(room.id)),
    stairs: document.stairs.filter((stair) => !stairIds.has(stair.id)),
    furniture: document.furniture.filter((item) => !furnitureIds.has(item.id)),
    columns: document.columns.filter((column) => !columnIds.has(column.id)),
  });
}

/**
 * Можно ли объединить комнаты: их хотя бы две, они на одном этаже и среди
 * них нет башен — у башни своя форма стен.
 *
 * @param rooms Комнаты.
 * @returns true, если можно.
 */
export function canMergeRooms(rooms: ReadonlyArray<PlanRoom>): boolean {
  const [first] = rooms;

  return (
    first !== undefined
    && rooms.length > 1
    && rooms.every(
      (room) => room.level === first.level && !isTowerKind(room.kind),
    )
  );
}

/**
 * Объединяет комнаты в одну: она получает все их клетки, а название, вид и
 * сооружение — от первой выбранной (сооружение — от первой, где оно есть).
 * Стены между бывшими комнатами исчезают вместе с дверями в них.
 *
 * @param document План.
 * @param roomIds Комнаты в порядке выбора: первая остаётся.
 * @returns Новый план или тот же, если объединить нельзя.
 */
export function mergeRooms(
  document: PlanDocument,
  roomIds: ReadonlyArray<string>,
): PlanDocument {
  const rooms = getSelectedRooms(
    document,
    roomIds.map((id) => ({ kind: 'room', id })),
  );

  const [target] = rooms;

  if (!target || !canMergeRooms(rooms)) {
    return document;
  }

  const merged = new Set(rooms.map((room) => room.id));

  const cells = [
    ...new Map(
      rooms
        .flatMap((room) => room.cells)
        .map((cell) => [getCellKey(cell.x, cell.y), cell]),
    ).values(),
  ];

  const facilityId = rooms.find((room) => room.facilityId)?.facilityId;

  return prunePlan({
    ...document,
    rooms: document.rooms.flatMap((room) => {
      if (room.id === target.id) {
        return [{ ...room, cells, facilityId }];
      }

      return merged.has(room.id) ? [] : [room];
    }),
  });
}
