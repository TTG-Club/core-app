import type {
  DoorKind,
  FurnitureKind,
  PlanCell,
  PlanCircle,
  PlanColumn,
  PlanDocument,
  PlanEdge,
  PlanFurniture,
  PlanRoom,
  PlanStair,
  PlanState,
  PlanTowerOpening,
  RoomKind,
  TowerShape,
} from './plan-schema';

import { fillTemplate } from '~bastions/model';

import {
  PLAN_FACILITY_COLORS,
  PLAN_FURNITURE_ROTATION_STEP,
  PLAN_HIT_TOLERANCE,
  PLAN_LABELS,
  PLAN_LIMITS,
  ROOM_KIND_LABELS,
  TOWER_SHAPE_ROOM_LABELS,
  TOWER_SHAPE_SIDES,
} from './plan-constants';
import {
  findTowerRing,
  getCanonicalEdge,
  getCellAt,
  getCellKey,
  getCircleCells,
  getEdgeKey,
  getFurnitureSize,
  getNearestEdge,
  getOccupancy,
  getTowerApothem,
  isCellOnGrid,
  isFurnitureOnGrid,
  isTowerKind,
  isWallEdge,
  toPlanCircle,
} from './plan-geometry';
import {
  DOOR_KINDS,
  planResponseSchema,
  PREMIUM_FURNITURE_KINDS,
  TOWER_SHAPES,
} from './plan-schema';

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
    furniture: [],
    defenseGates: [],
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
    premium: parsed.premium ?? false,
    document: {
      levels: [...levels].sort((first, second) => first - second),
      rooms: (source.rooms ?? []).map((room) => ({
        id: room.id,
        name: room.name ?? ROOM_KIND_LABELS[room.kind],
        kind: room.kind,
        level: room.level,
        facilityId: room.facilityId ?? undefined,
        cells: room.cells ?? [],
        shape:
          room.kind === 'TOWER' && room.shape
            ? toPlanCircle(room.shape)
            : undefined,
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
      furniture: source.furniture ?? [],
      defenseGates: source.defenseGates ?? [],
    },
  };
}

/**
 * Убирает всё повисшее после правки: пустые комнаты, двери и окна там, где
 * стены больше нет, проёмы удалённых башен, лестницы и колонны удалённых
 * этажей, ворота без защитной стены.
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

  const wallCells = new Set(
    document.defenseWalls.map((cell) => getCellKey(cell.x, cell.y)),
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
    furniture: document.furniture.filter((item) => levels.has(item.level)),
    defenseGates: document.defenseGates.filter((cell) =>
      wallCells.has(getCellKey(cell.x, cell.y)),
    ),
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
  const towers = placed.filter((room) => isTowerKind(room.kind)).map(claim);
  const others = placed.filter((room) => !isTowerKind(room.kind)).map(claim);

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
          isTowerKind(room.kind)
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
      room.level === target.level && !isTowerKind(room.kind)
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
  shape?: TowerShape,
): string {
  const label = shape ? TOWER_SHAPE_ROOM_LABELS[shape] : ROOM_KIND_LABELS[kind];

  const number =
    document.rooms.filter((room) => getRoomKindLabel(room) === label).length
    + 1;

  return fillTemplate(PLAN_LABELS.newRoom, { kind: label, number });
}

/**
 * Форма башни.
 *
 * @param room Комната.
 * @returns Форма или undefined, если это не башня.
 */
export function getTowerShape(room: PlanRoom): TowerShape | undefined {
  if (room.kind === 'SQUARE_TOWER') {
    return 'SQUARE';
  }

  if (room.kind !== 'TOWER') {
    return undefined;
  }

  const sides = room.shape?.sides;

  return (
    TOWER_SHAPES.find((shape) => TOWER_SHAPE_SIDES[shape] === sides) ?? 'ROUND'
  );
}

/**
 * Вид комнаты словами; у башни — с её формой.
 *
 * @param room Комната.
 * @returns «Комната», «Пятиугольная башня».
 */
export function getRoomKindLabel(room: PlanRoom): string {
  const shape = getTowerShape(room);

  return shape ? TOWER_SHAPE_ROOM_LABELS[shape] : ROOM_KIND_LABELS[room.kind];
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
 * Ставит башню: её клетки забираются у всех комнат этажа под ней, и у других
 * башен тоже, а защитная стена под ней исчезает.
 *
 * @param document План.
 * @param tower Новая башня.
 * @returns Новый план.
 */
function placeTower(document: PlanDocument, tower: PlanRoom): PlanDocument {
  const taken = new Set(tower.cells.map((cell) => getCellKey(cell.x, cell.y)));

  const rooms = document.rooms.map((room) =>
    room.level === tower.level
      ? {
          ...room,
          cells: room.cells.filter(
            (cell) => !taken.has(getCellKey(cell.x, cell.y)),
          ),
        }
      : room,
  );

  const defenseWalls =
    tower.level === 0
      ? document.defenseWalls.filter(
          (cell) => !taken.has(getCellKey(cell.x, cell.y)),
        )
      : document.defenseWalls;

  return prunePlan({ ...document, rooms: [...rooms, tower], defenseWalls });
}

/**
 * Ставит круглую или многоугольную башню. Её клетки забираются у комнат под
 * ней.
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
  return placeTower(document, {
    ...seed,
    kind: 'TOWER',
    facilityId: undefined,
    cells: getCircleCells(shape).filter(isCellOnGrid),
    shape,
  });
}

/**
 * Ставит квадратную башню: прямоугольник клеток с толстой стеной по краю.
 * Её клетки, как и у круглой, забираются у комнат под ней.
 *
 * @param document План.
 * @param seed Идентификатор, название и этаж.
 * @param cells Клетки квадрата.
 * @returns Новый план или тот же, если квадрат вне участка.
 */
export function addSquareTower(
  document: PlanDocument,
  seed: PlanRoomSeed,
  cells: ReadonlyArray<PlanCell>,
): PlanDocument {
  const inside = cells.filter(isCellOnGrid);

  if (!inside.length) {
    return document;
  }

  return placeTower(document, {
    ...seed,
    kind: 'SQUARE_TOWER',
    facilityId: undefined,
    cells: inside,
    shape: undefined,
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
      && !isTowerKind(room.kind)
      && !room.cells.every(isKept),
  );

  const hasWall = level === 0 && !document.defenseWalls.every(isKept);

  if (!hasFloor && !hasWall) {
    return document;
  }

  return prunePlan({
    ...document,
    rooms: document.rooms.map((room) =>
      room.level === level && !isTowerKind(room.kind)
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
  const column = findColumnAt(document, level, point);

  if (column) {
    return {
      ...document,
      columns: document.columns.filter((item) => item.id !== column.id),
    };
  }

  const furniture = findFurnitureAt(document, level, point);

  if (furniture) {
    return {
      ...document,
      furniture: document.furniture.filter((item) => item.id !== furniture.id),
    };
  }

  const stair = findStairAt(document, level, point);

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

/** Рамка лестницы в клетках. */
export interface PlanStairFrame extends PlanCell {
  width: number;
  height: number;
}

/**
 * Сторона винтовой лестницы вдоль одной оси: крупнейшая, что встаёт по центру
 * башни целыми клетками и не больше заданной. Если заданная меньше любой
 * подходящей, берётся наименьшая подходящая.
 *
 * @param center Центр башни по оси.
 * @param limit Наибольшая сторона, что помещается в башню.
 * @param requested Заданная сторона; undefined — наибольшая.
 * @returns Сторона в клетках.
 */
function fitSpiralSide(
  center: number,
  limit: number,
  requested = limit,
): number {
  const fits = (side: number) => Number.isInteger(center - side / 2);

  for (let side = Math.min(limit, requested); side >= 1; side--) {
    if (fits(side)) {
      return side;
    }
  }

  for (let side = 1; side <= limit; side++) {
    if (fits(side)) {
      return side;
    }
  }

  return 2;
}

/**
 * Где в башне помещается винтовая лестница: центр и наибольшая сторона. В
 * круглой башне у стены остаётся проход (в самой узкой лестница занимает её
 * всю), в квадратной лестница может занять её целиком.
 *
 * @param room Башня.
 * @returns Центр и наибольшая сторона или undefined, если это не башня.
 */
function getSpiralBounds(
  room: PlanRoom,
): { cx: number; cy: number; limit: number } | undefined {
  if (room.kind === 'TOWER' && room.shape) {
    const { cx, cy } = room.shape;
    const apothem = getTowerApothem(room.shape);

    return {
      cx,
      cy,
      limit: Math.min(
        PLAN_LIMITS.maxStairSide,
        Math.max(1, Math.floor(apothem * 2) - 1),
      ),
    };
  }

  if (room.kind !== 'SQUARE_TOWER' || !room.cells.length) {
    return undefined;
  }

  const xs = room.cells.map((cell) => cell.x);
  const ys = room.cells.map((cell) => cell.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const width = Math.max(...xs) - left + 1;
  const height = Math.max(...ys) - top + 1;

  return {
    cx: left + width / 2,
    cy: top + height / 2,
    limit: Math.min(PLAN_LIMITS.maxStairSide, width, height),
  };
}

/**
 * Рамка винтовой лестницы в башне под точкой: по центру башни, заданного
 * размера, насколько башня позволяет.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @param side Заданная сторона в клетках; undefined — наибольшая.
 * @returns Рамка или undefined, если под точкой не башня.
 */
export function getTowerStairFrame(
  document: PlanDocument,
  level: number,
  point: PlanCell,
  side?: number,
): PlanStairFrame | undefined {
  const room = findRoomAt(document, level, point);
  const bounds = room ? getSpiralBounds(room) : undefined;

  if (!bounds) {
    return undefined;
  }

  const width = fitSpiralSide(bounds.cx, bounds.limit, side);
  const height = fitSpiralSide(bounds.cy, bounds.limit, side);

  return {
    x: bounds.cx - width / 2,
    y: bounds.cy - height / 2,
    width,
    height,
  };
}

/**
 * Ставит в башню под точкой винтовую лестницу по её размеру. Если в середине
 * башни уже стоит винтовая лестница, меняет её размер.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @param seed Идентификатор, этаж назначения и сторона подъёма.
 * @param side Заданная сторона в клетках; undefined — наибольшая.
 * @returns Новый план или тот же, если под точкой не башня.
 */
export function placeTowerStair(
  document: PlanDocument,
  level: number,
  point: PlanCell,
  seed: Pick<PlanStair, 'id' | 'toLevel' | 'direction'>,
  side?: number,
): PlanDocument {
  const frame = getTowerStairFrame(document, level, point, side);

  if (!frame) {
    return document;
  }

  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;

  const existing = document.stairs.find(
    (stair) =>
      stair.level === level
      && stair.kind === 'SPIRAL'
      && stair.x + stair.width / 2 === centerX
      && stair.y + stair.height / 2 === centerY,
  );

  if (!existing) {
    return addStair(document, { ...seed, ...frame, level, kind: 'SPIRAL' });
  }

  if (existing.width === frame.width && existing.height === frame.height) {
    return document;
  }

  return {
    ...document,
    stairs: document.stairs.map((stair) =>
      stair.id === existing.id ? { ...stair, ...frame } : stair,
    ),
  };
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

/** Прямоугольник клеток этажа: оба угла входят. */
export interface PlanArea {
  from: PlanCell;
  to: PlanCell;
}

/**
 * Мебель под точкой.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @returns Предмет или undefined.
 */
export function findFurnitureAt(
  document: PlanDocument,
  level: number,
  point: PlanCell,
): PlanFurniture | undefined {
  return document.furniture.findLast((item) => {
    if (item.level !== level) {
      return false;
    }

    const { width, depth } = getFurnitureSize(item);

    return (
      point.x >= item.x
      && point.x <= item.x + width
      && point.y >= item.y
      && point.y <= item.y + depth
    );
  });
}

/**
 * Лестница под точкой.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @returns Лестница или undefined.
 */
export function findStairAt(
  document: PlanDocument,
  level: number,
  point: PlanCell,
): PlanStair | undefined {
  return document.stairs.find(
    (item) =>
      item.level === level
      && point.x >= item.x
      && point.x <= item.x + item.width
      && point.y >= item.y
      && point.y <= item.y + item.height,
  );
}

/**
 * Колонна рядом с точкой.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @returns Колонна или undefined.
 */
export function findColumnAt(
  document: PlanDocument,
  level: number,
  point: PlanCell,
): PlanColumn | undefined {
  return document.columns.find(
    (item) =>
      item.level === level
      && Math.hypot(item.x - point.x, item.y - point.y)
        < PLAN_HIT_TOLERANCE.column,
  );
}

const PREMIUM_FURNITURE = new Set<FurnitureKind>(PREMIUM_FURNITURE_KINDS);

/**
 * Предмет интерьера по подписке: ставится только в бастион владельца с
 * подпиской.
 *
 * @param kind Вид предмета.
 * @returns true, если по подписке.
 */
export function isPremiumFurniture(kind: FurnitureKind): boolean {
  return PREMIUM_FURNITURE.has(kind);
}

/**
 * Ставит мебель в клетку. Щелчок по уже стоящему предмету поворачивает его
 * на 90° — так же, как повторный щелчок по двери меняет её вид.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @param kind Что ставить.
 * @param rotation Поворот нового предмета, градусы по часовой.
 * @returns Новый план или тот же, если предмет не помещается на участке.
 */
export function placeFurniture(
  document: PlanDocument,
  level: number,
  point: PlanCell,
  kind: FurnitureKind,
  rotation = 0,
): PlanDocument {
  const existing = findFurnitureAt(document, level, point);

  if (existing) {
    return rotateFurniture(document, existing.id);
  }

  const cell = getCellAt(point);

  const item: PlanFurniture = {
    id: crypto.randomUUID(),
    level,
    x: cell.x,
    y: cell.y,
    kind,
    rotation,
  };

  return isFurnitureOnGrid(item)
    ? { ...document, furniture: [...document.furniture, item] }
    : document;
}

/**
 * Поворачивает стоящий предмет на 90° по часовой.
 *
 * @param document План.
 * @param id Предмет.
 * @returns Новый план или тот же, если после поворота предмет не помещается.
 */
export function rotateFurniture(
  document: PlanDocument,
  id: string,
): PlanDocument {
  return updateFurniture(document, id, (item) => ({
    ...item,
    rotation: (item.rotation + PLAN_FURNITURE_ROTATION_STEP) % 360,
  }));
}

/**
 * Сдвигает стоящий предмет на несколько клеток.
 *
 * @param document План.
 * @param id Предмет.
 * @param offset Сдвиг в клетках.
 * @returns Новый план или тот же, если сдвигать некуда.
 */
export function moveFurniture(
  document: PlanDocument,
  id: string,
  offset: PlanCell,
): PlanDocument {
  if (offset.x === 0 && offset.y === 0) {
    return document;
  }

  return updateFurniture(document, id, (item) => ({
    ...item,
    x: item.x + offset.x,
    y: item.y + offset.y,
  }));
}

/**
 * Меняет предмет, если он и после правки помещается на участке.
 *
 * @param document План.
 * @param id Предмет.
 * @param change Правка.
 * @returns Новый план или тот же.
 */
function updateFurniture(
  document: PlanDocument,
  id: string,
  change: (item: PlanFurniture) => PlanFurniture,
): PlanDocument {
  const existing = document.furniture.find((item) => item.id === id);

  if (!existing) {
    return document;
  }

  const next = change(existing);

  return isFurnitureOnGrid(next)
    ? {
        ...document,
        furniture: document.furniture.map((item) =>
          item.id === id ? next : item,
        ),
      }
    : document;
}

/**
 * Достраивает защитную стену по клеткам первого этажа вне комнат, не больше
 * купленных блоков.
 *
 * @param document План.
 * @param cells Клетки мазка.
 * @param limit Сколько блоков стены куплено; undefined — без ограничения.
 * @returns Новый план или тот же, если добавлять нечего.
 */
export function paintDefenseWall(
  document: PlanDocument,
  cells: ReadonlyArray<PlanCell>,
  limit?: number,
): PlanDocument {
  const occupancy = getOccupancy(document, 0);

  const existing = new Set(
    document.defenseWalls.map((cell) => getCellKey(cell.x, cell.y)),
  );

  const free =
    limit === undefined
      ? Number.POSITIVE_INFINITY
      : limit - document.defenseWalls.length;

  const added = cells.filter((cell) => {
    const key = getCellKey(cell.x, cell.y);

    if (existing.has(key) || occupancy.has(key) || !isCellOnGrid(cell)) {
      return false;
    }

    existing.add(key);

    return true;
  });

  const placed = added.slice(0, Math.max(0, free));

  return placed.length
    ? { ...document, defenseWalls: [...document.defenseWalls, ...placed] }
    : document;
}

/**
 * Окружён ли бастион защитной стеной полностью: от края участка нельзя дойти
 * до комнат первого этажа, не пересекая стену. Ходят только по сторонам
 * клеток, поэтому диагональный стык двух клеток стены сплошной. Ворота стоят
 * в стене и тоже её замыкают.
 *
 * @param document План.
 * @returns true, если на первом этаже есть комнаты и стена их окружает.
 */
export function isBastionWalled(document: PlanDocument): boolean {
  const occupancy = getOccupancy(document, 0);

  if (occupancy.size === 0 || document.defenseWalls.length === 0) {
    return false;
  }

  const size = PLAN_LIMITS.gridSize;

  const walls = new Set(
    document.defenseWalls.map((cell) => getCellKey(cell.x, cell.y)),
  );

  const visited = new Set<string>();
  const queue: Array<PlanCell> = [];

  /**
   * Ставит клетку в обход, если она на участке, не стена и ещё не пройдена.
   *
   * @param cell Клетка.
   */
  const visit = (cell: PlanCell): void => {
    const key = getCellKey(cell.x, cell.y);

    if (isCellOnGrid(cell) && !walls.has(key) && !visited.has(key)) {
      visited.add(key);
      queue.push(cell);
    }
  };

  for (let index = 0; index < size; index++) {
    visit({ x: index, y: 0 });
    visit({ x: index, y: size - 1 });
    visit({ x: 0, y: index });
    visit({ x: size - 1, y: index });
  }

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const cell = queue[cursor];

    if (!cell) {
      continue;
    }

    if (occupancy.has(getCellKey(cell.x, cell.y))) {
      return false;
    }

    visit({ x: cell.x + 1, y: cell.y });
    visit({ x: cell.x - 1, y: cell.y });
    visit({ x: cell.x, y: cell.y + 1 });
    visit({ x: cell.x, y: cell.y - 1 });
  }

  return true;
}

/**
 * Стоят ли ворота в клетке защитной стены.
 *
 * @param document План.
 * @param cell Клетка.
 * @returns true, если стоят.
 */
export function isDefenseGate(document: PlanDocument, cell: PlanCell): boolean {
  return document.defenseGates.some(
    (gate) => gate.x === cell.x && gate.y === cell.y,
  );
}

/**
 * Есть ли на клетке защитная стена.
 *
 * @param document План.
 * @param cell Клетка первого этажа.
 * @returns true, если есть.
 */
export function isDefenseWallCell(
  document: PlanDocument,
  cell: PlanCell,
): boolean {
  return document.defenseWalls.some(
    (wall) => wall.x === cell.x && wall.y === cell.y,
  );
}

/**
 * Ставит или убирает ворота в защитной стене. Ворота встают только в уже
 * построенную стену: клетки без стены пропускаются.
 *
 * @param document План.
 * @param cells Клетки мазка.
 * @param isGate true — поставить ворота, false — заложить проём стеной.
 * @returns Новый план или тот же, если менять нечего.
 */
export function paintDefenseGates(
  document: PlanDocument,
  cells: ReadonlyArray<PlanCell>,
  isGate: boolean,
): PlanDocument {
  const walls = new Set(
    document.defenseWalls.map((cell) => getCellKey(cell.x, cell.y)),
  );

  const gates = new Set(
    document.defenseGates.map((cell) => getCellKey(cell.x, cell.y)),
  );

  const changed = cells.filter((cell) => {
    const key = getCellKey(cell.x, cell.y);

    if (!walls.has(key) || gates.has(key) === isGate) {
      return false;
    }

    if (isGate) {
      gates.add(key);
    } else {
      gates.delete(key);
    }

    return true;
  });

  if (!changed.length) {
    return document;
  }

  return {
    ...document,
    defenseGates: isGate
      ? [...document.defenseGates, ...changed]
      : document.defenseGates.filter((cell) =>
          gates.has(getCellKey(cell.x, cell.y)),
        ),
  };
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
  /** Адрес сооружения в справочнике: по нему подбирается мебель. */
  facilityUrl: string;
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
      facilityUrl: string;
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
        facilityUrl: facility.facilityUrl,
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
