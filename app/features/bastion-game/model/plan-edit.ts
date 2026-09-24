import type {
  BuildingKind,
  CellSide,
  DoorKind,
  PassageKind,
  PlanBuilding,
  PlanCell,
  PlanDocument,
  PlanFloor,
  PlanOutline,
  PlanState,
  ResponseOutline,
} from './plan-schema';

import { fillTemplate } from '~bastions/model';

import {
  PLAN_FACILITY_COLORS,
  PLAN_LABELS,
  PLAN_LIMITS,
} from './plan-constants';
import { isCellInside } from './plan-geometry';
import { planResponseSchema } from './plan-schema';

/** Пустой план. */
export function createEmptyPlan(): PlanDocument {
  return { buildings: [], passages: [], walls: [] };
}

/**
 * Приводит контур из ответа к строгому виду; неполный контур отбрасывается.
 *
 * @param outline Контур из ответа.
 * @returns Контур или undefined.
 */
function normalizeOutline(outline: ResponseOutline): PlanOutline | undefined {
  if (outline.type === 'CIRCLE') {
    return outline.cx != null && outline.cy != null && outline.r != null
      ? { type: 'CIRCLE', cx: outline.cx, cy: outline.cy, r: outline.r }
      : undefined;
  }

  if (outline.type === 'RECTANGLE') {
    return outline.x != null
      && outline.y != null
      && outline.width != null
      && outline.height != null
      ? {
          type: 'RECTANGLE',
          x: outline.x,
          y: outline.y,
          width: outline.width,
          height: outline.height,
        }
      : undefined;
  }

  const points = (outline.points ?? []).flatMap(
    (point): Array<[number, number]> =>
      point.length === 2 ? [[point[0]!, point[1]!]] : [],
  );

  return points.length >= 3 ? { type: 'POLYGON', points } : undefined;
}

/**
 * Разбирает ответ сервера о плане: пустые списки вместо null, строгие контуры.
 *
 * @param response Ответ `GET /plan`.
 * @returns Состояние плана.
 */
export function parsePlanResponse(response: unknown): PlanState {
  const parsed = planResponseSchema.parse(response);

  const buildings = (parsed.document.buildings ?? []).flatMap(
    (building): Array<PlanBuilding> => {
      const outline = normalizeOutline(building.outline);

      if (!outline) {
        return [];
      }

      return [
        {
          id: building.id,
          name: building.name ?? '',
          kind: building.kind ?? 'KEEP',
          outline,
          floors: (building.floors ?? []).map((floor) => ({
            level: floor.level,
            cells: floor.cells ?? [],
            doors: floor.doors ?? [],
            windows: floor.windows ?? [],
            stairs: floor.stairs ?? [],
          })),
        },
      ];
    },
  );

  return {
    version: parsed.version,
    canEdit: parsed.canEdit,
    document: {
      buildings,
      passages: (parsed.document.passages ?? []).map((passage) => ({
        kind: passage.kind,
        level: passage.level,
        cells: passage.cells ?? [],
      })),
      walls: parsed.document.walls ?? [],
    },
  };
}

/**
 * Пустой этаж.
 *
 * @param level Уровень.
 * @returns Этаж без клеток и проёмов.
 */
function createFloor(level: number): PlanFloor {
  return { level, cells: [], doors: [], windows: [], stairs: [] };
}

/**
 * Уровни этажей нового корпуса: от первого этажа до текущего, чтобы по нему
 * сразу можно было рисовать. Подвал — только сам подвал.
 *
 * @param level Текущий уровень редактора.
 * @returns Уровни этажей.
 */
function getInitialLevels(level: number): Array<number> {
  if (level < 0) {
    return [level];
  }

  return Array.from({ length: level + 1 }, (_, index) => index);
}

/**
 * Добавляет корпус.
 *
 * @param document План.
 * @param building Идентификатор, название, вид и контур нового корпуса.
 * @param building.id Идентификатор.
 * @param building.name Название.
 * @param building.kind Вид.
 * @param building.outline Контур.
 * @param level Текущий уровень редактора.
 * @returns Новый план.
 */
export function addBuilding(
  document: PlanDocument,
  building: {
    id: string;
    name: string;
    kind: BuildingKind;
    outline: PlanOutline;
  },
  level: number,
): PlanDocument {
  return {
    ...document,
    buildings: [
      ...document.buildings,
      { ...building, floors: getInitialLevels(level).map(createFloor) },
    ],
  };
}

/**
 * Меняет корпус.
 *
 * @param document План.
 * @param buildingId Корпус.
 * @param change Что поменять.
 * @returns Новый план.
 */
export function updateBuilding(
  document: PlanDocument,
  buildingId: string,
  change: (building: PlanBuilding) => PlanBuilding,
): PlanDocument {
  return {
    ...document,
    buildings: document.buildings.map((building) =>
      building.id === buildingId ? change(building) : building,
    ),
  };
}

/**
 * Удаляет корпус вместе с его этажами.
 *
 * @param document План.
 * @param buildingId Корпус.
 * @returns Новый план.
 */
export function removeBuilding(
  document: PlanDocument,
  buildingId: string,
): PlanDocument {
  return {
    ...document,
    buildings: document.buildings.filter(
      (building) => building.id !== buildingId,
    ),
  };
}

/**
 * Сдвигает контур на целое число клеток.
 *
 * @param outline Контур.
 * @param dx Сдвиг по x.
 * @param dy Сдвиг по y.
 * @returns Сдвинутый контур.
 */
function translateOutline(
  outline: PlanOutline,
  dx: number,
  dy: number,
): PlanOutline {
  switch (outline.type) {
    case 'CIRCLE':
      return { ...outline, cx: outline.cx + dx, cy: outline.cy + dy };
    case 'RECTANGLE':
      return { ...outline, x: outline.x + dx, y: outline.y + dy };
    default:
      return {
        ...outline,
        points: outline.points.map(([x, y]) => [x + dx, y + dy]),
      };
  }
}

/**
 * Сдвигает точку на плане.
 *
 * @param point Точка с координатами клетки.
 * @param dx Сдвиг по x.
 * @param dy Сдвиг по y.
 * @returns Сдвинутая точка.
 */
function translatePoint<TPoint extends PlanCell>(
  point: TPoint,
  dx: number,
  dy: number,
): TPoint {
  return { ...point, x: point.x + dx, y: point.y + dy };
}

/**
 * Перемещает корпус вместе со всем, что на его этажах.
 *
 * @param document План.
 * @param buildingId Корпус.
 * @param dx Сдвиг по x, клеток.
 * @param dy Сдвиг по y, клеток.
 * @returns Новый план.
 */
export function moveBuilding(
  document: PlanDocument,
  buildingId: string,
  dx: number,
  dy: number,
): PlanDocument {
  return updateBuilding(document, buildingId, (building) => ({
    ...building,
    outline: translateOutline(building.outline, dx, dy),
    floors: building.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) => translatePoint(cell, dx, dy)),
      doors: floor.doors.map((door) => translatePoint(door, dx, dy)),
      windows: floor.windows.map((window) => translatePoint(window, dx, dy)),
      stairs: floor.stairs.map((stair) => translatePoint(stair, dx, dy)),
    })),
  }));
}

/**
 * Добавляет этаж над верхним или под нижним.
 *
 * @param document План.
 * @param buildingId Корпус.
 * @param direction Вверх или вниз.
 * @returns Новый план.
 */
export function addFloor(
  document: PlanDocument,
  buildingId: string,
  direction: 'up' | 'down',
): PlanDocument {
  return updateBuilding(document, buildingId, (building) => {
    const levels = building.floors.map((floor) => floor.level);

    const level =
      direction === 'up' ? Math.max(...levels) + 1 : Math.min(...levels) - 1;

    const outOfRange =
      level > PLAN_LIMITS.maxLevel
      || level < PLAN_LIMITS.minLevel
      || building.floors.length >= PLAN_LIMITS.maxFloors;

    return outOfRange
      ? building
      : { ...building, floors: [...building.floors, createFloor(level)] };
  });
}

/**
 * Убирает этаж; лестницы на него исчезают вместе с ним. Последний этаж не
 * убирается — корпус без этажей сервер не примет.
 *
 * @param document План.
 * @param buildingId Корпус.
 * @param level Уровень этажа.
 * @returns Новый план.
 */
export function removeFloor(
  document: PlanDocument,
  buildingId: string,
  level: number,
): PlanDocument {
  return updateBuilding(document, buildingId, (building) => {
    if (building.floors.length <= 1) {
      return building;
    }

    return {
      ...building,
      floors: building.floors
        .filter((floor) => floor.level !== level)
        .map((floor) => ({
          ...floor,
          stairs: floor.stairs.filter((stair) => stair.toLevel !== level),
        })),
    };
  });
}

/**
 * Корпус, в который входит клетка и у которого есть этаж на этом уровне.
 * Верхний по порядку добавления выигрывает: его и видно поверх остальных.
 *
 * @param document План.
 * @param level Уровень.
 * @param cell Клетка.
 * @returns Корпус или undefined.
 */
export function findBuildingAt(
  document: PlanDocument,
  level: number,
  cell: PlanCell,
): PlanBuilding | undefined {
  return document.buildings.findLast(
    (building) =>
      building.floors.some((floor) => floor.level === level)
      && isCellInside(building.outline, cell),
  );
}

/**
 * Меняет этаж корпуса, в который входит клетка. Вне корпусов план не меняется.
 *
 * @param document План.
 * @param level Уровень.
 * @param cell Клетка.
 * @param change Что поменять на этаже.
 * @returns Новый план.
 */
function updateFloorAt(
  document: PlanDocument,
  level: number,
  cell: PlanCell,
  change: (floor: PlanFloor) => PlanFloor,
): PlanDocument {
  const building = findBuildingAt(document, level, cell);

  if (!building) {
    return document;
  }

  return updateBuilding(document, building.id, (current) => ({
    ...current,
    floors: current.floors.map((floor) =>
      floor.level === level ? change(floor) : floor,
    ),
  }));
}

/**
 * Одинаковое ли положение у двух точек.
 *
 * @param first Первая точка.
 * @param second Вторая точка.
 * @returns true, если клетка одна.
 */
function isSameCell(first: PlanCell, second: PlanCell): boolean {
  return first.x === second.x && first.y === second.y;
}

/**
 * Площадь сооружений на плане: сумма клеток по всем этажам и корпусам.
 *
 * @param document План.
 * @returns Сооружение → число клеток.
 */
export function getFacilityAreas(document: PlanDocument): Map<string, number> {
  const areas = new Map<string, number>();

  for (const building of document.buildings) {
    for (const floor of building.floors) {
      for (const cell of floor.cells) {
        areas.set(cell.facilityId, (areas.get(cell.facilityId) ?? 0) + 1);
      }
    }
  }

  return areas;
}

/**
 * Закрашивает клетку сооружением. Не красит вне корпусов и сверх площади
 * пространства — сервер такой план всё равно не примет.
 *
 * @param document План.
 * @param level Уровень.
 * @param cell Клетка.
 * @param facility Сооружение и его наибольшая площадь.
 * @param facility.id Сооружение персонажа.
 * @param facility.squares Площадь пространства, клеток.
 * @returns Новый план.
 */
export function paintFacilityCell(
  document: PlanDocument,
  level: number,
  cell: PlanCell,
  facility: { id: string; squares: number },
): PlanDocument {
  const building = findBuildingAt(document, level, cell);
  const floor = building?.floors.find((item) => item.level === level);
  const existing = floor?.cells.find((item) => isSameCell(item, cell));

  if (!floor || existing?.facilityId === facility.id) {
    return document;
  }

  if ((getFacilityAreas(document).get(facility.id) ?? 0) >= facility.squares) {
    return document;
  }

  return updateFloorAt(document, level, cell, (current) => ({
    ...current,
    cells: [
      ...current.cells.filter((item) => !isSameCell(item, cell)),
      { ...cell, facilityId: facility.id },
    ],
  }));
}

/**
 * Стирает всё, что лежит в клетке на этом уровне: сооружение, лестницу,
 * двери и окна клетки, переход; на первом этаже — и стену.
 *
 * @param document План.
 * @param level Уровень.
 * @param cell Клетка.
 * @returns Новый план.
 */
export function eraseAt(
  document: PlanDocument,
  level: number,
  cell: PlanCell,
): PlanDocument {
  const withoutFloorItems = updateFloorAt(document, level, cell, (floor) => ({
    ...floor,
    cells: floor.cells.filter((item) => !isSameCell(item, cell)),
    doors: floor.doors.filter((item) => !isSameCell(item, cell)),
    windows: floor.windows.filter((item) => !isSameCell(item, cell)),
    stairs: floor.stairs.filter((item) => !isSameCell(item, cell)),
  }));

  return {
    ...withoutFloorItems,
    passages: withoutFloorItems.passages
      .map((passage) =>
        passage.level === level
          ? {
              ...passage,
              cells: passage.cells.filter((item) => !isSameCell(item, cell)),
            }
          : passage,
      )
      .filter((passage) => passage.cells.length > 0),
    walls:
      level === 0
        ? withoutFloorItems.walls.filter((item) => !isSameCell(item, cell))
        : withoutFloorItems.walls,
  };
}

/**
 * Ставит дверь на ребро клетки или убирает её, если такая уже стоит.
 *
 * @param document План.
 * @param level Уровень.
 * @param edge Клетка и сторона.
 * @param kind Вид двери.
 * @returns Новый план.
 */
export function toggleDoor(
  document: PlanDocument,
  level: number,
  edge: PlanCell & { side: CellSide },
  kind: DoorKind,
): PlanDocument {
  return updateFloorAt(document, level, edge, (floor) => {
    const isSameEdge = (door: PlanCell & { side: CellSide }) =>
      isSameCell(door, edge) && door.side === edge.side;

    const existing = floor.doors.find(isSameEdge);

    const doors = floor.doors.filter((door) => !isSameEdge(door));

    return {
      ...floor,
      doors: existing?.kind === kind ? doors : [...doors, { ...edge, kind }],
    };
  });
}

/**
 * Ставит окно на ребро клетки или убирает его.
 *
 * @param document План.
 * @param level Уровень.
 * @param edge Клетка и сторона.
 * @returns Новый план.
 */
export function toggleWindow(
  document: PlanDocument,
  level: number,
  edge: PlanCell & { side: CellSide },
): PlanDocument {
  return updateFloorAt(document, level, edge, (floor) => {
    const exists = floor.windows.some(
      (window) => isSameCell(window, edge) && window.side === edge.side,
    );

    return {
      ...floor,
      windows: exists
        ? floor.windows.filter(
            (window) =>
              !(isSameCell(window, edge) && window.side === edge.side),
          )
        : [...floor.windows, edge],
    };
  });
}

/**
 * Ставит лестницу или убирает её. Лестница ведёт на этаж выше, а с верхнего —
 * на этаж ниже; у одноэтажного корпуса лестницы нет.
 *
 * @param document План.
 * @param level Уровень.
 * @param cell Клетка.
 * @returns Новый план.
 */
export function toggleStair(
  document: PlanDocument,
  level: number,
  cell: PlanCell,
): PlanDocument {
  const building = findBuildingAt(document, level, cell);
  const levels = new Set(building?.floors.map((floor) => floor.level) ?? []);

  const toLevel = [level + 1, level - 1].find((candidate) =>
    levels.has(candidate),
  );

  if (toLevel === undefined) {
    return document;
  }

  return updateFloorAt(document, level, cell, (floor) => {
    const exists = floor.stairs.some((stair) => isSameCell(stair, cell));

    return {
      ...floor,
      stairs: exists
        ? floor.stairs.filter((stair) => !isSameCell(stair, cell))
        : [...floor.stairs, { ...cell, toLevel }],
    };
  });
}

/**
 * Лежит ли клетка на участке.
 *
 * @param cell Клетка.
 * @returns true, если внутри участка.
 */
function isOnGrid(cell: PlanCell): boolean {
  return (
    cell.x >= 0
    && cell.y >= 0
    && cell.x < PLAN_LIMITS.gridSize
    && cell.y < PLAN_LIMITS.gridSize
  );
}

/**
 * Добавляет клетку перехода нужного вида на уровне.
 *
 * @param document План.
 * @param level Уровень.
 * @param cell Клетка.
 * @param kind Вид перехода.
 * @returns Новый план.
 */
export function paintPassage(
  document: PlanDocument,
  level: number,
  cell: PlanCell,
  kind: PassageKind,
): PlanDocument {
  const taken = document.passages.some(
    (passage) =>
      passage.level === level
      && passage.cells.some((item) => isSameCell(item, cell)),
  );

  if (taken || !isOnGrid(cell)) {
    return document;
  }

  const group = document.passages.find(
    (passage) => passage.level === level && passage.kind === kind,
  );

  return {
    ...document,
    passages: group
      ? document.passages.map((passage) =>
          passage === group
            ? { ...passage, cells: [...passage.cells, cell] }
            : passage,
        )
      : [...document.passages, { kind, level, cells: [cell] }],
  };
}

/**
 * Добавляет клетку защитной стены.
 *
 * @param document План.
 * @param cell Клетка.
 * @returns Новый план.
 */
export function paintWall(
  document: PlanDocument,
  cell: PlanCell,
): PlanDocument {
  if (
    !isOnGrid(cell)
    || document.walls.some((item) => isSameCell(item, cell))
  ) {
    return document;
  }

  return { ...document, walls: [...document.walls, cell] };
}

/**
 * Все уровни плана — чтобы показать переключатель этажей.
 *
 * @param document План.
 * @returns Уровни по возрастанию; первый этаж есть всегда.
 */
export function getPlanLevels(document: PlanDocument): Array<number> {
  const levels = new Set<number>([0]);

  for (const building of document.buildings) {
    for (const floor of building.floors) {
      levels.add(floor.level);
    }
  }

  for (const passage of document.passages) {
    levels.add(passage.level);
  }

  return [...levels].sort((first, second) => first - second);
}

/** Сооружение в палитре редактора: имя, персонаж, цвет и занятая площадь. */
export interface PlanPaletteFacility {
  id: string;
  name: string;
  characterName: string;
  squares: number;
  used: number;
  color: number;
}

/**
 * Палитра сооружений всех персонажей бастиона. Цвет закреплён за позицией
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
