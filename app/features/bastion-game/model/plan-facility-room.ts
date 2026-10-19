import type {
  FurnitureKind,
  PlanCell,
  PlanDocument,
  PlanFurniture,
  PlanRoom,
} from './plan-schema';

import {
  PLAN_FACILITY_FURNITURE,
  PLAN_FACILITY_FURNITURE_DEFAULT,
  PLAN_FURNITURE_FILL_LIMIT,
  PLAN_FURNITURE_ROTATIONS,
} from './plan-constants';
import { drawRoom, isPremiumFurniture } from './plan-edit';
import {
  getCellKey,
  getFurnitureSize,
  getOccupancy,
  getRectCells,
  isCellOnGrid,
  isFloorFurniture,
  sortFurnitureByLayer,
} from './plan-geometry';

/** Сооружение, из которого ставится готовая комната. */
export interface PlanFacilityRoomSource {
  id: string;
  name: string;
  facilityUrl: string;
  squares: number;
  /** Предметы интерьера из справочника; пусто — набор по виду сооружения. */
  furniture: ReadonlyArray<FurnitureKind>;
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
 * Предметы, которыми обставляется готовая комната: заданные в справочнике
 * сооружения, а без них — набор по его адресу (для незнакомого — стол, стул
 * и сундук). Предметы по подписке без подписки отбрасываются.
 *
 * @param facilityUrl Адрес сооружения в справочнике.
 * @param furniture Предметы из справочника; пусто — набор по умолчанию.
 * @param isPremium Есть ли у владельца бастиона подписка.
 * @returns Предметы без повторов.
 */
export function getFacilityFurniture(
  facilityUrl: string,
  furniture: ReadonlyArray<FurnitureKind>,
  isPremium: boolean,
): Array<FurnitureKind> {
  const kinds = furniture.length
    ? furniture
    : getDefaultFacilityFurniture(facilityUrl);

  return [...new Set(kinds)].filter(
    (kind) => isPremium || !isPremiumFurniture(kind),
  );
}

/**
 * Набор предметов по умолчанию для сооружения по его адресу в справочнике.
 *
 * @param facilityUrl Адрес сооружения.
 * @returns Предметы.
 */
export function getDefaultFacilityFurniture(
  facilityUrl: string,
): ReadonlyArray<FurnitureKind> {
  const key = Object.keys(PLAN_FACILITY_FURNITURE).find(
    (name) => facilityUrl === name || facilityUrl.startsWith(`${name}-`),
  );

  return (
    (key ? PLAN_FACILITY_FURNITURE[key] : undefined)
    ?? PLAN_FACILITY_FURNITURE_DEFAULT
  );
}

/**
 * Случайный элемент списка.
 *
 * @param items Список.
 * @param random Источник случайных чисел от 0 до 1.
 * @returns Элемент или undefined для пустого списка.
 */
function pickRandom<T>(
  items: ReadonlyArray<T>,
  random: () => number,
): T | undefined {
  return items[Math.floor(random() * items.length)];
}

/**
 * Перемешивает список (Фишер — Йейтс).
 *
 * @param items Список.
 * @param random Источник случайных чисел от 0 до 1.
 * @returns Новый перемешанный список.
 */
function shuffle<T>(items: ReadonlyArray<T>, random: () => number): Array<T> {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    const current = result[index];
    const swapped = result[other];

    if (current !== undefined && swapped !== undefined) {
      result[index] = swapped;
      result[other] = current;
    }
  }

  return result;
}

/**
 * Случайно расставляет предметы по прямоугольной комнате без наложений.
 * Ковёр лежит на полу, и мебель может стоять на нём; два ковра и два других
 * предмета друг на друга не встают. Сначала каждый предмет ставится по разу,
 * потом случайные предметы из списка добавляются, пока мебель вместе с
 * коврами не закроет 60% пола или пока ничего больше не поместится.
 *
 * @param room Комната.
 * @param level Этаж.
 * @param kinds Предметы, которые бывают в комнате.
 * @param random Источник случайных чисел от 0 до 1.
 * @returns Расставленные предметы.
 */
export function furnishRoom(
  room: PlanRect,
  level: number,
  kinds: ReadonlyArray<FurnitureKind>,
  random: () => number = Math.random,
): Array<PlanFurniture> {
  const limit = Math.floor(room.width * room.depth * PLAN_FURNITURE_FILL_LIMIT);
  // Клетки под коврами, под остальной мебелью и закрытые хоть чем-то.
  const floor = new Set<string>();
  const solid = new Set<string>();
  const covered = new Set<string>();
  const placed: Array<PlanFurniture> = [];
  const queue = shuffle(kinds, random);

  let available = [...new Set(kinds)];

  /**
   * Ставит предмет в случайное свободное место.
   *
   * @param kind Предмет.
   * @returns true, если предмет встал.
   */
  function place(kind: FurnitureKind): boolean {
    const rotations = shuffle(PLAN_FURNITURE_ROTATIONS, random);
    const layer = isFloorFurniture(kind) ? floor : solid;

    for (const rotation of rotations) {
      const { width, depth } = getFurnitureSize({ kind, rotation });
      const spots: Array<{ cell: PlanCell; keys: Array<string> }> = [];

      for (let y = room.y; y + depth <= room.y + room.depth; y++) {
        for (let x = room.x; x + width <= room.x + room.width; x++) {
          const keys = getRectCells(
            { x, y },
            { x: x + width - 1, y: y + depth - 1 },
          ).map((cell) => getCellKey(cell.x, cell.y));

          const added = keys.filter((key) => !covered.has(key)).length;

          if (
            keys.every((key) => !layer.has(key))
            && covered.size + added <= limit
          ) {
            spots.push({ cell: { x, y }, keys });
          }
        }
      }

      const spot = pickRandom(spots, random);

      if (spot) {
        spot.keys.forEach((key) => {
          layer.add(key);
          covered.add(key);
        });

        placed.push({
          id: crypto.randomUUID(),
          level,
          ...spot.cell,
          kind,
          rotation,
        });

        return true;
      }
    }

    return false;
  }

  for (const kind of queue) {
    if (!place(kind)) {
      available = available.filter((item) => item !== kind);
    }
  }

  // Предметы, которым больше нет места, выбывают; остальные добавляются,
  // пока есть куда.
  while (available.length) {
    const kind = pickRandom(available, random);

    if (kind && !place(kind)) {
      available = available.filter((item) => item !== kind);
    }
  }

  return sortFurnitureByLayer(placed);
}

/**
 * Ставит готовую комнату сооружения: прямоугольник его площади с центром в
 * клетке под указателем, со случайно расставленными предметами сооружения.
 *
 * @param document План.
 * @param level Этаж.
 * @param center Клетка под указателем.
 * @param facility Сооружение.
 * @param isPremium Есть ли у владельца бастиона подписка.
 * @param random Источник случайных чисел от 0 до 1.
 * @returns Новый план или тот же, если место занято.
 */
export function placeFacilityRoom(
  document: PlanDocument,
  level: number,
  center: PlanCell,
  facility: PlanFacilityRoomSource,
  isPremium: boolean,
  random: () => number = Math.random,
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
    getFacilityFurniture(facility.facilityUrl, facility.furniture, isPremium),
    random,
  );

  return { ...withRoom, furniture: [...withRoom.furniture, ...furniture] };
}
