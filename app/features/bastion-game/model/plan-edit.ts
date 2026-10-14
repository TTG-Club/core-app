import type {
  DoorKind,
  PlanCell,
  PlanCircle,
  PlanColumn,
  PlanDocument,
  PlanEdge,
  PlanRoom,
  PlanStair,
  PlanState,
  PlanTowerOpening,
  RoomKind,
} from './plan-schema';

import { fillTemplate } from '~bastions/model';

import {
  PLAN_FACILITY_COLORS,
  PLAN_HIT_TOLERANCE,
  PLAN_LABELS,
  PLAN_LIMITS,
  ROOM_KIND_LABELS,
} from './plan-constants';
import {
  findTowerRing,
  getCanonicalEdge,
  getCellAt,
  getCellKey,
  getCircleCells,
  getEdgeCells,
  getEdgeKey,
  getNearestEdge,
  getOccupancy,
  isCellOnGrid,
  isWallEdge,
} from './plan-geometry';
import { DOOR_KINDS, planResponseSchema } from './plan-schema';

/** Имя, этаж и идентификатор комнаты, которую создаст правка. */
export interface PlanRoomSeed {
  id: string;
  name: string;
  level: number;
}

/** Пустой план: один первый этаж. */
export function createEmptyPlan(): PlanDocument {
  return {
    levels: [0],
    rooms: [],
    doors: [],
    windows: [],
    towerOpenings: [],
    stairs: [],
    columns: [],
    defenseWalls: [],
  };
}

/**
 * Разбирает ответ сервера о плане: пустые списки вместо null, первый этаж
 * есть всегда.
 *
 * @param response Ответ `GET /plan`.
 * @returns Состояние плана.
 */
export function parsePlanResponse(response: unknown): PlanState {
  const parsed = planResponseSchema.parse(response);
  const source = parsed.document;
  const levels = new Set([0, ...(source.levels ?? [])]);

  return {
    version: parsed.version,
    canEdit: parsed.canEdit,
    document: {
      levels: [...levels].sort((first, second) => first - second),
      rooms: (source.rooms ?? []).map((room) => ({
        id: room.id,
        name: room.name ?? ROOM_KIND_LABELS[room.kind],
        kind: room.kind,
        level: room.level,
        facilityId: room.facilityId ?? undefined,
        cells: room.cells ?? [],
        shape: room.kind === 'TOWER' ? (room.shape ?? undefined) : undefined,
      })),
      doors: source.doors ?? [],
      windows: source.windows ?? [],
      towerOpenings: (source.towerOpenings ?? []).map((opening) => ({
        ...opening,
        kind: opening.kind ?? undefined,
      })),
      stairs: source.stairs ?? [],
      columns: source.columns ?? [],
      defenseWalls: source.defenseWalls ?? [],
    },
  };
}

/**
 * Убирает всё повисшее после правки: пустые комнаты, двери и окна там, где
 * стены больше нет, проёмы удалённых башен, лестницы и колонны удалённых
 * этажей.
 *
 * @param document План.
 * @returns Чистый план.
 */
export function prunePlan(document: PlanDocument): PlanDocument {
  const rooms = document.rooms.filter((room) => room.cells.length > 0);
  const levels = new Set(document.levels);

  const occupancies = new Map(
    document.levels.map((level) => [
      level,
      getOccupancy({ ...document, rooms }, level),
    ]),
  );

  const isOnWall = (edge: PlanEdge): boolean => {
    const occupancy = occupancies.get(edge.level);

    return occupancy !== undefined && isWallEdge(occupancy, edge);
  };

  const towers = new Set(
    rooms.filter((room) => room.kind === 'TOWER').map((room) => room.id),
  );

  return {
    ...document,
    rooms,
    doors: document.doors.filter(isOnWall),
    windows: document.windows.filter(isOnWall),
    towerOpenings: document.towerOpenings.filter((opening) =>
      towers.has(opening.roomId),
    ),
    stairs: document.stairs.filter(
      (stair) => levels.has(stair.level) && levels.has(stair.toLevel),
    ),
    columns: document.columns.filter((column) => levels.has(column.level)),
  };
}

/**
 * Сводит план, собранный из правок нескольких людей, к тому же виду, что
 * получит сервер (`PlanRules.normalize`): комнаты удалённых этажей уходят,
 * спорная клетка остаётся за башней, затем за комнатой раньше в списке, а на
 * ребре с дверью и окном остаётся дверь. Остальное подчищает `prunePlan`.
 *
 * @param document План после слияния.
 * @returns План без противоречий.
 */
export function resolvePlanConflicts(document: PlanDocument): PlanDocument {
  const levels = [...new Set([0, ...document.levels])].sort(
    (first, second) => first - second,
  );

  const levelSet = new Set(levels);
  const taken = new Set<string>();

  const claim = (room: PlanRoom): PlanRoom => {
    const cells = room.cells.filter((cell) => {
      const key = `${room.level}:${getCellKey(cell.x, cell.y)}`;

      if (taken.has(key)) {
        return false;
      }

      taken.add(key);

      return true;
    });

    return cells.length === room.cells.length ? room : { ...room, cells };
  };

  const placed = document.rooms.filter((room) => levelSet.has(room.level));
  const towers = placed.filter((room) => room.kind === 'TOWER').map(claim);
  const others = placed.filter((room) => room.kind !== 'TOWER').map(claim);

  const resolved = new Map(
    [...towers, ...others].map((room) => [room.id, room]),
  );

  const doorEdges = new Set(document.doors.map(getEdgeKey));

  return prunePlan({
    ...document,
    levels,
    rooms: placed.flatMap((room) => resolved.get(room.id) ?? []),
    windows: document.windows.filter(
      (window) => !doorEdges.has(getEdgeKey(window)),
    ),
  });
}

/**
 * Клетки башен этажа — их не забирают комнаты, нарисованные поверх.
 *
 * @param document План.
 * @param level Этаж.
 * @param exceptRoomId Башня, которую не учитывать.
 * @returns Ключи клеток.
 */
function getTowerCellKeys(
  document: PlanDocument,
  level: number,
  exceptRoomId?: string,
): Set<string> {
  return new Set(
    document.rooms
      .filter(
        (room) =>
          room.kind === 'TOWER'
          && room.level === level
          && room.id !== exceptRoomId,
      )
      .flatMap((room) => room.cells.map((cell) => getCellKey(cell.x, cell.y))),
  );
}

/**
 * Отдаёт клетки комнате, забирая их у других комнат этажа. Клетки башен и
 * клетки вне участка не забираются; защитная стена под новой комнатой
 * исчезает.
 *
 * @param document План.
 * @param target Комната, которой достаются клетки (может быть новой).
 * @param cells Клетки.
 * @returns Новый план.
 */
function claimCells(
  document: PlanDocument,
  target: PlanRoom,
  cells: ReadonlyArray<PlanCell>,
): PlanDocument {
  const towerCells = getTowerCellKeys(document, target.level, target.id);

  const free = cells.filter(
    (cell) => isCellOnGrid(cell) && !towerCells.has(getCellKey(cell.x, cell.y)),
  );

  const taken = new Set(free.map((cell) => getCellKey(cell.x, cell.y)));
  const own = new Set(target.cells.map((cell) => getCellKey(cell.x, cell.y)));

  // Клетки мазка могут повторяться (кисть шире клетки, слитый коридор):
  // каждая добавляется один раз.
  const added = [...taken]
    .filter((key) => !own.has(key))
    .map((key) => {
      const [x = 0, y = 0] = key.split(':').map(Number);

      return { x, y };
    });

  const merged = [...target.cells, ...added];

  const others = document.rooms
    .filter((room) => room.id !== target.id)
    .map((room) =>
      room.level === target.level && room.kind !== 'TOWER'
        ? {
            ...room,
            cells: room.cells.filter(
              (cell) => !taken.has(getCellKey(cell.x, cell.y)),
            ),
          }
        : room,
    );

  const defenseWalls =
    target.level === 0
      ? document.defenseWalls.filter(
          (cell) => !taken.has(getCellKey(cell.x, cell.y)),
        )
      : document.defenseWalls;

  return prunePlan({
    ...document,
    rooms: [...others, { ...target, cells: merged }],
    defenseWalls,
  });
}

/**
 * Комната под точкой.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @returns Комната или undefined.
 */
export function findRoomAt(
  document: PlanDocument,
  level: number,
  point: PlanCell,
): PlanRoom | undefined {
  const cell = getCellAt(point);

  return getOccupancy(document, level).get(getCellKey(cell.x, cell.y));
}

/**
 * Название новой комнаты: вид и номер следующей такой.
 *
 * @param document План.
 * @param kind Вид.
 * @returns «Комната 3».
 */
export function getNextRoomName(
  document: PlanDocument,
  kind: RoomKind,
): string {
  const number = document.rooms.filter((room) => room.kind === kind).length + 1;

  return fillTemplate(PLAN_LABELS.newRoom, {
    kind: ROOM_KIND_LABELS[kind],
    number,
  });
}

/**
 * Рисует прямоугольную комнату или расширяет существующую.
 *
 * @param document План.
 * @param cells Клетки прямоугольника.
 * @param target Комната, которую расширить, или данные новой.
 * @returns Новый план.
 */
export function drawRoom(
  document: PlanDocument,
  cells: ReadonlyArray<PlanCell>,
  target: PlanRoom | PlanRoomSeed,
): PlanDocument {
  const room: PlanRoom =
    'kind' in target
      ? target
      : {
          ...target,
          kind: 'ROOM',
          facilityId: undefined,
          cells: [],
          shape: undefined,
        };

  return claimCells(document, room, cells);
}

/**
 * Ставит круглую башню. Её клетки забираются у комнат под ней.
 *
 * @param document План.
 * @param seed Идентификатор, название и этаж.
 * @param shape Окружность пола.
 * @returns Новый план.
 */
export function addTower(
  document: PlanDocument,
  seed: PlanRoomSeed,
  shape: PlanCircle,
): PlanDocument {
  const cells = getCircleCells(shape).filter(isCellOnGrid);
  const taken = new Set(cells.map((cell) => getCellKey(cell.x, cell.y)));

  const rooms = document.rooms.map((room) =>
    room.level === seed.level
      ? {
          ...room,
          cells: room.cells.filter(
            (cell) => !taken.has(getCellKey(cell.x, cell.y)),
          ),
        }
      : room,
  );

  const defenseWalls =
    seed.level === 0
      ? document.defenseWalls.filter(
          (cell) => !taken.has(getCellKey(cell.x, cell.y)),
        )
      : document.defenseWalls;

  return prunePlan({
    ...document,
    rooms: [
      ...rooms,
      { ...seed, kind: 'TOWER', facilityId: undefined, cells, shape },
    ],
    defenseWalls,
  });
}

/**
 * Прокладывает коридор по клеткам. Комнаты коридор не перекрывает, а
 * задетые им другие коридоры сливаются с ним в один.
 *
 * @param document План.
 * @param cells Клетки мазка.
 * @param target Коридор, который продолжить, или данные нового.
 * @returns Новый план.
 */
export function paintCorridor(
  document: PlanDocument,
  cells: ReadonlyArray<PlanCell>,
  target: PlanRoom | PlanRoomSeed,
): PlanDocument {
  const occupancy = getOccupancy(document, target.level);
  const touched = new Set<string>();

  const free = cells.filter((cell) => {
    const owner = occupancy.get(getCellKey(cell.x, cell.y));

    if (owner && owner.kind === 'CORRIDOR' && owner.id !== target.id) {
      touched.add(owner.id);
    }

    return !owner || owner.kind === 'CORRIDOR';
  });

  const existing = document.rooms.find((room) => room.id === target.id);

  const corridor: PlanRoom = existing ?? {
    ...target,
    kind: 'CORRIDOR',
    facilityId: undefined,
    cells: [],
    shape: undefined,
  };

  const absorbed = document.rooms
    .filter((room) => touched.has(room.id))
    .flatMap((room) => room.cells);

  return claimCells(
    {
      ...document,
      rooms: document.rooms.filter((room) => !touched.has(room.id)),
    },
    corridor,
    [...absorbed, ...free],
  );
}

/**
 * Стирает пол в клетках и защитную стену на них. Башню ластик не режет —
 * её убирают щелчком по кольцу или кнопкой «Удалить».
 *
 * @param document План.
 * @param level Этаж.
 * @param cells Клетки.
 * @returns Новый план или тот же, если стирать нечего.
 */
export function eraseCells(
  document: PlanDocument,
  level: number,
  cells: ReadonlyArray<PlanCell>,
): PlanDocument {
  const erased = new Set(cells.map((cell) => getCellKey(cell.x, cell.y)));
  const isKept = (cell: PlanCell) => !erased.has(getCellKey(cell.x, cell.y));

  const hasFloor = document.rooms.some(
    (room) =>
      room.level === level
      && room.kind !== 'TOWER'
      && !room.cells.every(isKept),
  );

  const hasWall = level === 0 && !document.defenseWalls.every(isKept);

  if (!hasFloor && !hasWall) {
    return document;
  }

  return prunePlan({
    ...document,
    rooms: document.rooms.map((room) =>
      room.level === level && room.kind !== 'TOWER'
        ? { ...room, cells: room.cells.filter(isKept) }
        : room,
    ),
    defenseWalls:
      level === 0
        ? document.defenseWalls.filter(isKept)
        : document.defenseWalls,
  });
}

/**
 * Убирает то, что лежит под точкой: колонну, лестницу, проём в башне, дверь
 * или окно. Щелчок по кольцу башни без проёма убирает саму башню.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @returns Новый план или тот же, если под точкой ничего нет.
 */
export function eraseObjectAt(
  document: PlanDocument,
  level: number,
  point: PlanCell,
): PlanDocument {
  const column = document.columns.find(
    (item) =>
      item.level === level
      && Math.hypot(item.x - point.x, item.y - point.y)
        < PLAN_HIT_TOLERANCE.column,
  );

  if (column) {
    return {
      ...document,
      columns: document.columns.filter((item) => item.id !== column.id),
    };
  }

  const stair = document.stairs.find(
    (item) =>
      item.level === level
      && point.x >= item.x
      && point.x <= item.x + item.width
      && point.y >= item.y
      && point.y <= item.y + item.height,
  );

  if (stair) {
    return {
      ...document,
      stairs: document.stairs.filter((item) => item.id !== stair.id),
    };
  }

  const ring = findTowerRing(
    document,
    level,
    point,
    PLAN_HIT_TOLERANCE.edge * 2,
  );

  if (ring) {
    const opening = document.towerOpenings.find(
      (item) => item.roomId === ring.room.id && item.angle === ring.angle,
    );

    return opening
      ? {
          ...document,
          towerOpenings: document.towerOpenings.filter(
            (item) => item !== opening,
          ),
        }
      : removeRoom(document, ring.room.id);
  }

  const edge = getNearestEdge(level, point);

  if (edge.distance > PLAN_HIT_TOLERANCE.edge) {
    return document;
  }

  const key = getEdgeKey(edge);
  const doors = document.doors.filter((door) => getEdgeKey(door) !== key);
  const windows = document.windows.filter((item) => getEdgeKey(item) !== key);

  return doors.length === document.doors.length
    && windows.length === document.windows.length
    ? document
    : { ...document, doors, windows };
}

/**
 * Следующий вид двери по кругу — повторный щелчок по двери меняет её вид.
 *
 * @param kind Текущий вид.
 * @returns Следующий вид.
 */
function getNextDoorKind(kind: DoorKind): DoorKind {
  const index = DOOR_KINDS.indexOf(kind);

  return DOOR_KINDS[(index + 1) % DOOR_KINDS.length] ?? kind;
}

/**
 * Ставит проём в кольцо башни. Повторный щелчок по двери меняет её вид.
 *
 * @param document План.
 * @param opening Проём.
 * @returns Новый план.
 */
function placeTowerOpening(
  document: PlanDocument,
  opening: PlanTowerOpening,
): PlanDocument {
  const existing = document.towerOpenings.find(
    (item) => item.roomId === opening.roomId && item.angle === opening.angle,
  );

  if (!existing) {
    return {
      ...document,
      towerOpenings: [...document.towerOpenings, opening],
    };
  }

  if (existing.type !== 'DOOR' || opening.type !== 'DOOR' || !existing.kind) {
    return document;
  }

  const kind = getNextDoorKind(existing.kind);

  return {
    ...document,
    towerOpenings: document.towerOpenings.map((item) =>
      item === existing ? { ...item, kind } : item,
    ),
  };
}

/**
 * Ставит дверь или окно в стену под точкой: в ребро сетки или в кольцо
 * башни. Дверь заменяет окно на том же месте и наоборот; повторный щелчок по
 * двери меняет её вид.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @param opening Что ставить: дверь с видом или окно.
 * @returns Новый план или тот же, если стены под точкой нет.
 */
export function placeOpening(
  document: PlanDocument,
  level: number,
  point: PlanCell,
  opening: { type: 'DOOR'; kind: DoorKind } | { type: 'WINDOW' },
): PlanDocument {
  const ring = findTowerRing(document, level, point, PLAN_HIT_TOLERANCE.tower);

  if (ring) {
    return placeTowerOpening(document, {
      roomId: ring.room.id,
      angle: ring.angle,
      type: opening.type,
      kind: opening.type === 'DOOR' ? opening.kind : undefined,
    });
  }

  const nearest = getNearestEdge(level, point);

  const edge = getCanonicalEdge({
    level,
    x: nearest.x,
    y: nearest.y,
    side: nearest.side,
  });

  if (!isWallEdge(getOccupancy(document, level), edge)) {
    return document;
  }

  const key = getEdgeKey(edge);
  const door = document.doors.find((item) => getEdgeKey(item) === key);
  const windows = document.windows.filter((item) => getEdgeKey(item) !== key);

  if (opening.type === 'WINDOW') {
    return windows.length !== document.windows.length
      ? document
      : {
          ...document,
          doors: document.doors.filter((item) => item !== door),
          windows: [...document.windows, edge],
        };
  }

  if (door) {
    const kind = getNextDoorKind(door.kind);

    return {
      ...document,
      doors: document.doors.map((item) =>
        item === door ? { ...item, kind } : item,
      ),
    };
  }

  return {
    ...document,
    windows,
    doors: [...document.doors, { ...edge, kind: opening.kind }],
  };
}

/**
 * Добавляет лестницу.
 *
 * @param document План.
 * @param stair Лестница.
 * @returns Новый план.
 */
export function addStair(
  document: PlanDocument,
  stair: PlanStair,
): PlanDocument {
  return { ...document, stairs: [...document.stairs, stair] };
}

/**
 * Ставит колонну; на занятое колонной место вторую не ставит.
 *
 * @param document План.
 * @param column Колонна.
 * @returns Новый план или тот же.
 */
export function addColumn(
  document: PlanDocument,
  column: PlanColumn,
): PlanDocument {
  const isTaken = document.columns.some(
    (item) =>
      item.level === column.level && item.x === column.x && item.y === column.y,
  );

  return isTaken
    ? document
    : { ...document, columns: [...document.columns, column] };
}

/**
 * Достраивает защитную стену по клеткам первого этажа вне комнат.
 *
 * @param document План.
 * @param cells Клетки мазка.
 * @returns Новый план или тот же, если добавлять нечего.
 */
export function paintDefenseWall(
  document: PlanDocument,
  cells: ReadonlyArray<PlanCell>,
): PlanDocument {
  const occupancy = getOccupancy(document, 0);

  const existing = new Set(
    document.defenseWalls.map((cell) => getCellKey(cell.x, cell.y)),
  );

  const added = cells.filter((cell) => {
    const key = getCellKey(cell.x, cell.y);

    if (existing.has(key) || occupancy.has(key) || !isCellOnGrid(cell)) {
      return false;
    }

    existing.add(key);

    return true;
  });

  return added.length
    ? { ...document, defenseWalls: [...document.defenseWalls, ...added] }
    : document;
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
  const occupancy = getOccupancy(document, room.level);

  return room.cells.every((cell) => {
    const moved = { x: cell.x + offset.x, y: cell.y + offset.y };
    const owner = occupancy.get(getCellKey(moved.x, moved.y));

    return isCellOnGrid(moved) && (!owner || owner.id === room.id);
  });
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
  const room = document.rooms.find((item) => item.id === roomId);

  if (
    !room
    || (offset.x === 0 && offset.y === 0)
    || !canMoveRoom(document, room, offset)
  ) {
    return document;
  }

  const own = new Set(room.cells.map((cell) => getCellKey(cell.x, cell.y)));
  const isOwn = (cell: PlanCell) => own.has(getCellKey(cell.x, cell.y));

  const shift = <T extends PlanCell & { level: number }>(item: T): T =>
    item.level === room.level
      ? { ...item, x: item.x + offset.x, y: item.y + offset.y }
      : item;

  const isOnEdge = (edge: PlanEdge) =>
    edge.level === room.level && getEdgeCells(edge).some(isOwn);

  const moved: PlanRoom = {
    ...room,
    cells: room.cells.map((cell) => ({
      x: cell.x + offset.x,
      y: cell.y + offset.y,
    })),
    shape: room.shape
      ? {
          ...room.shape,
          cx: room.shape.cx + offset.x,
          cy: room.shape.cy + offset.y,
        }
      : undefined,
  };

  return prunePlan({
    ...document,
    rooms: document.rooms.map((item) => (item.id === roomId ? moved : item)),
    doors: document.doors.map((door) => (isOnEdge(door) ? shift(door) : door)),
    windows: document.windows.map((item) =>
      isOnEdge(item) ? shift(item) : item,
    ),
    stairs: document.stairs.map((stair) =>
      stair.level === room.level && isOwn(stair) ? shift(stair) : stair,
    ),
    columns: document.columns.map((column) =>
      column.level === room.level && isOwn(getCellAt(column))
        ? shift(column)
        : column,
    ),
  });
}

/**
 * Меняет комнату: название, вид или сооружение.
 *
 * @param document План.
 * @param roomId Комната.
 * @param change Что поменять.
 * @returns Новый план.
 */
export function updateRoom(
  document: PlanDocument,
  roomId: string,
  change: Partial<Pick<PlanRoom, 'name' | 'kind' | 'facilityId'>>,
): PlanDocument {
  return prunePlan({
    ...document,
    rooms: document.rooms.map((room) =>
      room.id === roomId ? { ...room, ...change } : room,
    ),
  });
}

/**
 * Удаляет комнату.
 *
 * @param document План.
 * @param roomId Комната.
 * @returns Новый план.
 */
export function removeRoom(
  document: PlanDocument,
  roomId: string,
): PlanDocument {
  return prunePlan({
    ...document,
    rooms: document.rooms.filter((room) => room.id !== roomId),
  });
}

/**
 * Этажи плана по возрастанию.
 *
 * @param document План.
 * @returns Уровни.
 */
export function getPlanLevels(document: PlanDocument): Array<number> {
  return [...document.levels].sort((first, second) => first - second);
}

/**
 * Добавляет этаж над верхним или подвал под нижним.
 *
 * @param document План.
 * @param direction Вверх или вниз.
 * @returns Новый план и уровень нового этажа или тот же план, если упёрлись
 *   в предел.
 */
export function addLevel(
  document: PlanDocument,
  direction: 'up' | 'down',
): { document: PlanDocument; level: number | undefined } {
  const levels = getPlanLevels(document);

  const level =
    direction === 'up' ? (levels.at(-1) ?? 0) + 1 : (levels[0] ?? 0) - 1;

  const isAllowed =
    levels.length < PLAN_LIMITS.maxFloors
    && level >= PLAN_LIMITS.minLevel
    && level <= PLAN_LIMITS.maxLevel;

  return isAllowed
    ? { document: { ...document, levels: [...levels, level] }, level }
    : { document, level: undefined };
}

/**
 * Можно ли убрать этаж: только пустой верхний или нижний, кроме первого.
 *
 * @param document План.
 * @param level Этаж.
 * @returns true, если можно.
 */
export function canRemoveLevel(document: PlanDocument, level: number): boolean {
  const levels = getPlanLevels(document);
  const isEdge = level === levels[0] || level === levels.at(-1);

  return (
    level !== 0
    && isEdge
    && !document.rooms.some((room) => room.level === level)
    && !document.stairs.some((stair) => stair.level === level)
    && !document.columns.some((column) => column.level === level)
  );
}

/**
 * Убирает пустой крайний этаж; лестницы на него исчезают.
 *
 * @param document План.
 * @param level Этаж.
 * @returns Новый план или тот же, если убрать нельзя.
 */
export function removeLevel(
  document: PlanDocument,
  level: number,
): PlanDocument {
  return canRemoveLevel(document, level)
    ? prunePlan({
        ...document,
        levels: document.levels.filter((item) => item !== level),
      })
    : document;
}

/**
 * Этаж, на который поведёт новая лестница: выбранное направление или, если
 * его нет, ближайший этаж выше, а за ним — ниже.
 *
 * @param document План.
 * @param level Текущий этаж.
 * @param target Выбранное направление.
 * @returns Уровень или undefined, если вести некуда.
 */
export function getStairTargetLevel(
  document: PlanDocument,
  level: number,
  target: 'up' | 'down' | undefined,
): number | undefined {
  const levels = new Set(document.levels);
  const above = levels.has(level + 1) ? level + 1 : undefined;
  const below = levels.has(level - 1) ? level - 1 : undefined;

  if (target === 'up') {
    return above;
  }

  if (target === 'down') {
    return below;
  }

  return above ?? below;
}

/**
 * Площадь каждого сооружения на плане: клетки всех его комнат.
 *
 * @param document План.
 * @returns Сооружение → клеток.
 */
export function getFacilityAreas(document: PlanDocument): Map<string, number> {
  const areas = new Map<string, number>();

  for (const room of document.rooms) {
    if (room.facilityId) {
      areas.set(
        room.facilityId,
        (areas.get(room.facilityId) ?? 0) + room.cells.length,
      );
    }
  }

  return areas;
}

/** Сооружение бастиона в редакторе: имя, персонаж, цвет и занятая площадь. */
export interface PlanPaletteFacility {
  id: string;
  name: string;
  characterName: string;
  squares: number;
  used: number;
  color: number;
}

/**
 * Сооружения всех персонажей бастиона. Цвет закреплён за позицией
 * сооружения в бастионе, а не на плане: при правке плана цвета не прыгают.
 *
 * @param members Персонажи бастиона с сооружениями.
 * @param document План — для подсчёта занятой площади.
 * @returns Сооружения в порядке персонажей.
 */
export function createPaletteFacilities(
  members: ReadonlyArray<{
    characterName: string;
    facilities: ReadonlyArray<{
      id: string;
      name: string;
      space: { squares: number };
    }>;
  }>,
  document: PlanDocument,
): Array<PlanPaletteFacility> {
  const areas = getFacilityAreas(document);

  return members
    .flatMap((member) =>
      member.facilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        characterName: member.characterName,
        squares: facility.space.squares,
        used: areas.get(facility.id) ?? 0,
      })),
    )
    .map((facility, index) => ({
      ...facility,
      color: PLAN_FACILITY_COLORS[index % PLAN_FACILITY_COLORS.length]!,
    }));
}

/**
 * Подпись этажа: уровень 0 — «1 этаж», отрицательные — подвалы.
 *
 * @param level Уровень.
 * @returns Подпись.
 */
export function getLevelLabel(level: number): string {
  return level < 0
    ? fillTemplate(PLAN_LABELS.basementLabel, { depth: -level })
    : fillTemplate(PLAN_LABELS.levelLabel, { floor: level + 1 });
}
