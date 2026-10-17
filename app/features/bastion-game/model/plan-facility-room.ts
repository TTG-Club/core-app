import type {
  FurnitureKind,
  PlanCell,
  PlanDocument,
  PlanFurniture,
  PlanRoom,
} from './plan-schema';

import {
  PLAN_CENTER_FURNITURE,
  PLAN_FACILITY_FURNITURE,
  PLAN_FACILITY_FURNITURE_DEFAULT,
} from './plan-constants';
import { drawRoom, isPremiumFurniture } from './plan-edit';
import {
  getCellKey,
  getFurnitureSize,
  getOccupancy,
  getRectCells,
  isCellOnGrid,
} from './plan-geometry';

/** Сооружение, из которого ставится готовая комната. */
export interface PlanFacilityRoomSource {
  id: string;
  name: string;
  facilityUrl: string;
  squares: number;
}

/** Размер прямоугольной комнаты в клетках. */
export interface PlanRoomSize {
  width: number;
  depth: number;
}

/** Прямоугольник на плане: левая верхняя клетка и размер. */
interface PlanRect extends PlanRoomSize {
  x: number;
  y: number;
}

/**
 * Прямоугольник ровно на заданное число клеток, ближе всего к квадрату:
 * 16 клеток — 4×4, 12 — 4×3. Длинная сторона идёт по горизонтали.
 *
 * @param squares Площадь в клетках.
 * @returns Ширина и глубина.
 */
export function getFacilityRoomSize(squares: number): PlanRoomSize {
  const area = Math.max(1, Math.floor(squares));

  let side = Math.floor(Math.sqrt(area));

  while (area % side !== 0) {
    side--;
  }

  return { width: area / side, depth: side };
}

/**
 * Клетки готовой комнаты с центром в клетке под указателем.
 *
 * @param center Клетка под указателем.
 * @param size Размер комнаты.
 * @returns Клетки в порядке строк.
 */
export function getFacilityRoomCells(
  center: PlanCell,
  size: PlanRoomSize,
): Array<PlanCell> {
  const from = {
    x: center.x - Math.floor((size.width - 1) / 2),
    y: center.y - Math.floor((size.depth - 1) / 2),
  };

  return getRectCells(from, {
    x: from.x + size.width - 1,
    y: from.y + size.depth - 1,
  });
}

/**
 * Можно ли поставить комнату в эти клетки: все на участке, не заняты другими
 * комнатами этажа и, на первом этаже, защитной стеной.
 *
 * @param document План.
 * @param level Этаж.
 * @param cells Клетки комнаты.
 * @returns true, если место свободно.
 */
export function canPlaceFacilityRoom(
  document: PlanDocument,
  level: number,
  cells: ReadonlyArray<PlanCell>,
): boolean {
  const occupancy = getOccupancy(document, level);

  const walls = new Set(
    level === 0
      ? document.defenseWalls.map((cell) => getCellKey(cell.x, cell.y))
      : [],
  );

  return cells.every((cell) => {
    const key = getCellKey(cell.x, cell.y);

    return isCellOnGrid(cell) && !occupancy.has(key) && !walls.has(key);
  });
}

/**
 * Набор мебели для сооружения: по адресу справочника, а для незнакомого —
 * стол, стул и сундук. Предметы по подписке без подписки отбрасываются.
 *
 * @param facilityUrl Адрес сооружения в справочнике.
 * @param isPremium Есть ли у владельца бастиона подписка.
 * @returns Предметы в порядке расстановки.
 */
export function getFacilityFurniture(
  facilityUrl: string,
  isPremium: boolean,
): Array<FurnitureKind> {
  const key = Object.keys(PLAN_FACILITY_FURNITURE).find(
    (name) => facilityUrl === name || facilityUrl.startsWith(`${name}-`),
  );

  const kinds =
    (key ? PLAN_FACILITY_FURNITURE[key] : undefined)
    ?? PLAN_FACILITY_FURNITURE_DEFAULT;

  return kinds.filter((kind) => isPremium || !isPremiumFurniture(kind));
}

/**
 * Места для предмета внутри комнаты в порядке предпочтения: крупное в
 * середине, остальное вдоль стен, начиная от верхней.
 *
 * @param room Комната.
 * @param size Размер предмета с учётом поворота.
 * @param isCentered Ставить ли ближе к середине.
 * @returns Левые верхние клетки предмета.
 */
function getFurnitureSpots(
  room: PlanRect,
  size: PlanRoomSize,
  isCentered: boolean,
): Array<PlanCell> {
  const spots: Array<PlanCell & { score: number }> = [];
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.depth / 2;

  for (let y = room.y; y + size.depth <= room.y + room.depth; y++) {
    for (let x = room.x; x + size.width <= room.x + room.width; x++) {
      const touchesWall =
        x === room.x
        || y === room.y
        || x + size.width === room.x + room.width
        || y + size.depth === room.y + room.depth;

      const distance = Math.hypot(
        x + size.width / 2 - centerX,
        y + size.depth / 2 - centerY,
      );

      // Пристенные предметы сначала занимают места у стен по порядку строк,
      // а в середину встают, только когда у стен места нет.
      const wallScore = touchesWall ? 0 : room.width * room.depth + distance;

      spots.push({ x, y, score: isCentered ? distance : wallScore });
    }
  }

  return spots.sort((first, second) => first.score - second.score);
}

/**
 * Расставляет мебель по прямоугольной комнате, не ставя предметы друг на
 * друга. Что не поместилось, остаётся за дверью.
 *
 * @param room Комната.
 * @param level Этаж.
 * @param kinds Предметы в порядке расстановки.
 * @returns Расставленные предметы.
 */
export function furnishRoom(
  room: PlanRect,
  level: number,
  kinds: ReadonlyArray<FurnitureKind>,
): Array<PlanFurniture> {
  const taken = new Set<string>();
  const placed: Array<PlanFurniture> = [];

  for (const kind of kinds) {
    const isCentered = PLAN_CENTER_FURNITURE.has(kind);

    const options = [0, 90].flatMap((rotation) =>
      getFurnitureSpots(
        room,
        getFurnitureSize({ kind, rotation }),
        isCentered,
      ).map((spot) => ({ ...spot, rotation })),
    );

    const spot = options.find((option) => {
      const { width, depth } = getFurnitureSize({
        kind,
        rotation: option.rotation,
      });

      return getRectCells(option, {
        x: option.x + width - 1,
        y: option.y + depth - 1,
      }).every((cell) => !taken.has(getCellKey(cell.x, cell.y)));
    });

    if (!spot) {
      continue;
    }

    const { width, depth } = getFurnitureSize({
      kind,
      rotation: spot.rotation,
    });

    getRectCells(spot, {
      x: spot.x + width - 1,
      y: spot.y + depth - 1,
    }).forEach((cell) => taken.add(getCellKey(cell.x, cell.y)));

    placed.push({
      id: crypto.randomUUID(),
      level,
      x: spot.x,
      y: spot.y,
      kind,
      rotation: spot.rotation,
    });
  }

  return placed;
}

/**
 * Ставит готовую комнату сооружения: прямоугольник его площади с центром в
 * клетке под указателем, обставленный мебелью по виду сооружения.
 *
 * @param document План.
 * @param level Этаж.
 * @param center Клетка под указателем.
 * @param facility Сооружение.
 * @param isPremium Есть ли у владельца бастиона подписка.
 * @returns Новый план или тот же, если место занято.
 */
export function placeFacilityRoom(
  document: PlanDocument,
  level: number,
  center: PlanCell,
  facility: PlanFacilityRoomSource,
  isPremium: boolean,
): PlanDocument {
  const size = getFacilityRoomSize(facility.squares);
  const cells = getFacilityRoomCells(center, size);
  const [corner] = cells;

  if (!corner || !canPlaceFacilityRoom(document, level, cells)) {
    return document;
  }

  const room: PlanRoom = {
    id: crypto.randomUUID(),
    name: facility.name,
    kind: 'ROOM',
    level,
    facilityId: facility.id,
    cells: [],
    shape: undefined,
  };

  const withRoom = drawRoom(document, cells, room);

  const furniture = furnishRoom(
    { ...corner, ...size },
    level,
    getFacilityFurniture(facility.facilityUrl, isPremium),
  );

  return { ...withRoom, furniture: [...withRoom.furniture, ...furniture] };
}
