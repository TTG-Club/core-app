import type {
  CellSide,
  PlanCell,
  PlanCircle,
  PlanDocument,
  PlanEdge,
  PlanFurniture,
  PlanRoom,
} from './plan-schema';

import { PLAN_FURNITURE_SIZES, PLAN_LIMITS } from './plan-constants';

/** Точность сравнения: центр ровно на окружности считается внутри. */
const EPSILON = 1e-9;

/** Граница на ребре: стена, пунктирный край двора или ничего. */
export type PlanBoundaryKind = 'wall' | 'edge';

/** Отрезок в клетках. */
export interface PlanSegment {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

/** Клетка этажа → комната, которой она принадлежит. */
export type PlanOccupancy = ReadonlyMap<string, PlanRoom>;

/**
 * Ключ клетки для словарей.
 *
 * @param x Столбец.
 * @param y Строка.
 * @returns Ключ «x:y».
 */
export function getCellKey(x: number, y: number): string {
  return `${x}:${y}`;
}

/**
 * Клетка под точкой холста.
 *
 * @param point Точка в клетках, дробная.
 * @returns Клетка.
 */
export function getCellAt(point: PlanCell): PlanCell {
  return { x: Math.floor(point.x), y: Math.floor(point.y) };
}

/**
 * Привязывает координату к сетке с шагом в полклетки: центр клетки или линия.
 *
 * @param value Координата в клетках.
 * @returns Координата, кратная 0.5.
 */
export function snapToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Лежит ли клетка на участке.
 *
 * @param cell Клетка.
 * @returns true, если на участке.
 */
export function isCellOnGrid(cell: PlanCell): boolean {
  return (
    cell.x >= 0
    && cell.y >= 0
    && cell.x < PLAN_LIMITS.gridSize
    && cell.y < PLAN_LIMITS.gridSize
  );
}

/**
 * Размер мебели в клетках с учётом поворота.
 *
 * @param furniture Предмет: вид и поворот.
 * @returns Ширина по x и глубина по y.
 */
export function getFurnitureSize(
  furniture: Pick<PlanFurniture, 'kind' | 'rotation'>,
): { width: number; depth: number } {
  const size = PLAN_FURNITURE_SIZES[furniture.kind];

  return furniture.rotation % 180 === 0
    ? size
    : { width: size.depth, depth: size.width };
}

/**
 * Помещается ли мебель на участке целиком.
 *
 * @param furniture Предмет.
 * @returns true, если не выходит за край.
 */
export function isFurnitureOnGrid(furniture: PlanFurniture): boolean {
  const { width, depth } = getFurnitureSize(furniture);

  return (
    isCellOnGrid(furniture)
    && isCellOnGrid({ x: furniture.x + width - 1, y: furniture.y + depth - 1 })
  );
}

/**
 * Клетки прямоугольника между двумя углами, включая оба.
 *
 * @param from Угловая клетка.
 * @param to Противоположная угловая клетка.
 * @returns Клетки в порядке строк.
 */
export function getRectCells(from: PlanCell, to: PlanCell): Array<PlanCell> {
  const cells: Array<PlanCell> = [];

  for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      cells.push({ x, y });
    }
  }

  return cells;
}

/**
 * Клетки башни: те, чей центр лежит внутри окружности. Правило совпадает с
 * серверным `PlanGeometry` — иначе счётчики площади на экране разошлись бы с
 * проверкой при сохранении.
 *
 * @param circle Окружность башни.
 * @returns Клетки в порядке строк.
 */
export function getCircleCells(circle: PlanCircle): Array<PlanCell> {
  const cells: Array<PlanCell> = [];
  const top = Math.floor(circle.cy - circle.r);
  const left = Math.floor(circle.cx - circle.r);

  for (let y = top; y < Math.ceil(circle.cy + circle.r); y++) {
    for (let x = left; x < Math.ceil(circle.cx + circle.r); x++) {
      const deltaX = x + 0.5 - circle.cx;
      const deltaY = y + 0.5 - circle.cy;

      if (deltaX * deltaX + deltaY * deltaY <= circle.r * circle.r + EPSILON) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

/**
 * Ребро в каноническом виде: нижняя сторона клетки — это верхняя сторона
 * клетки под ней, правая — левая сторона соседа. Так одно ребро записывается
 * одинаково с обеих сторон.
 *
 * @param edge Ребро.
 * @returns То же ребро со стороной N или W.
 */
export function getCanonicalEdge<T extends PlanEdge>(edge: T): T {
  if (edge.side === 'S') {
    return { ...edge, y: edge.y + 1, side: 'N' };
  }

  if (edge.side === 'E') {
    return { ...edge, x: edge.x + 1, side: 'W' };
  }

  return edge;
}

/**
 * Ключ ребра с этажом: одинаков для обеих сторон ребра.
 *
 * @param edge Ребро.
 * @returns Ключ «level:x:y:side».
 */
export function getEdgeKey(edge: PlanEdge): string {
  const canonical = getCanonicalEdge(edge);

  return `${canonical.level}:${canonical.x}:${canonical.y}:${canonical.side}`;
}

/**
 * Две клетки по обе стороны ребра.
 *
 * @param edge Ребро.
 * @returns Клетки до и после ребра.
 */
export function getEdgeCells(edge: PlanEdge): [PlanCell, PlanCell] {
  const canonical = getCanonicalEdge(edge);

  return canonical.side === 'N'
    ? [
        { x: canonical.x, y: canonical.y - 1 },
        { x: canonical.x, y: canonical.y },
      ]
    : [
        { x: canonical.x - 1, y: canonical.y },
        { x: canonical.x, y: canonical.y },
      ];
}

/**
 * Ближайшее к точке ребро сетки.
 *
 * @param level Этаж.
 * @param point Точка в клетках.
 * @returns Ребро и расстояние до него в клетках.
 */
export function getNearestEdge(
  level: number,
  point: PlanCell,
): PlanEdge & { distance: number } {
  const rowLine = Math.round(point.y);
  const columnLine = Math.round(point.x);
  const toRow = Math.abs(point.y - rowLine);
  const toColumn = Math.abs(point.x - columnLine);

  return toRow <= toColumn
    ? { level, x: Math.floor(point.x), y: rowLine, side: 'N', distance: toRow }
    : {
        level,
        x: columnLine,
        y: Math.floor(point.y),
        side: 'W',
        distance: toColumn,
      };
}

/**
 * Клетки этажа с их комнатами.
 *
 * @param document План.
 * @param level Этаж.
 * @returns Клетка → комната.
 */
export function getOccupancy(
  document: PlanDocument,
  level: number,
): Map<string, PlanRoom> {
  const occupancy = new Map<string, PlanRoom>();

  for (const room of document.rooms) {
    if (room.level !== level) {
      continue;
    }

    for (const cell of room.cells) {
      occupancy.set(getCellKey(cell.x, cell.y), room);
    }
  }

  return occupancy;
}

/**
 * Открыт ли проход между соседними комнатами без стены: внутри одной
 * комнаты, между коридорами и на стыке с башней — её закрывает кольцо стены.
 *
 * @param first Комната с одной стороны.
 * @param second Комната с другой стороны.
 * @returns true, если стены нет.
 */
function isOpenBetween(first: PlanRoom, second: PlanRoom): boolean {
  return (
    first === second
    || first.kind === 'TOWER'
    || second.kind === 'TOWER'
    || (first.kind === 'CORRIDOR' && second.kind === 'CORRIDOR')
  );
}

/**
 * Что стоит на ребре: стена между разными комнатами и снаружи, пунктир по
 * краю двора, ничего внутри комнаты. Круглую стену башни рисует её кольцо.
 *
 * @param occupancy Клетки этажа.
 * @param edge Ребро.
 * @returns Вид границы или undefined.
 */
export function getBoundaryKind(
  occupancy: PlanOccupancy,
  edge: PlanEdge,
): PlanBoundaryKind | undefined {
  const [before, after] = getEdgeCells(edge);
  const first = occupancy.get(getCellKey(before.x, before.y));
  const second = occupancy.get(getCellKey(after.x, after.y));

  if (first && second) {
    return isOpenBetween(first, second) ? undefined : 'wall';
  }

  const single = first ?? second;

  if (!single || single.kind === 'TOWER') {
    return undefined;
  }

  return single.kind === 'COURTYARD' ? 'edge' : 'wall';
}

/**
 * Стоит ли на ребре стена — только в неё ставятся двери и окна.
 *
 * @param occupancy Клетки этажа.
 * @param edge Ребро.
 * @returns true, если стена.
 */
export function isWallEdge(occupancy: PlanOccupancy, edge: PlanEdge): boolean {
  return getBoundaryKind(occupancy, edge) === 'wall';
}

/**
 * Рёбра этажа с границей нужного вида, слитые в длинные отрезки: так стена
 * рисуется одной линией без швов на каждой клетке.
 *
 * @param occupancy Клетки этажа.
 * @param level Этаж.
 * @param kind Вид границы.
 * @returns Отрезки в клетках.
 */
export function getBoundarySegments(
  occupancy: PlanOccupancy,
  level: number,
  kind: PlanBoundaryKind,
): Array<PlanSegment> {
  const rows = new Map<number, Set<number>>();
  const columns = new Map<number, Set<number>>();
  const sides: ReadonlyArray<CellSide> = ['N', 'E', 'S', 'W'];

  for (const key of occupancy.keys()) {
    const [x = 0, y = 0] = key.split(':').map(Number);

    for (const side of sides) {
      const edge = getCanonicalEdge({ level, x, y, side });

      if (getBoundaryKind(occupancy, edge) !== kind) {
        continue;
      }

      const lines = edge.side === 'N' ? rows : columns;
      const line = edge.side === 'N' ? edge.y : edge.x;
      const position = edge.side === 'N' ? edge.x : edge.y;
      const positions = lines.get(line) ?? new Set<number>();

      positions.add(position);
      lines.set(line, positions);
    }
  }

  return [
    ...mergeRuns(rows, (line, from, to) => ({
      fromX: from,
      fromY: line,
      toX: to,
      toY: line,
    })),
    ...mergeRuns(columns, (line, from, to) => ({
      fromX: line,
      fromY: from,
      toX: line,
      toY: to,
    })),
  ];
}

/**
 * Сливает подряд идущие единичные рёбра одной линии в отрезки.
 *
 * @param lines Линия сетки → начала единичных рёбер на ней.
 * @param createSegment Строит отрезок по линии, началу и концу.
 * @returns Отрезки.
 */
function mergeRuns(
  lines: ReadonlyMap<number, ReadonlySet<number>>,
  createSegment: (line: number, from: number, to: number) => PlanSegment,
): Array<PlanSegment> {
  const segments: Array<PlanSegment> = [];

  for (const [line, positions] of lines) {
    const sorted = [...positions].sort((first, second) => first - second);

    let start = sorted[0];
    let previous = start;

    for (const position of sorted.slice(1)) {
      if (
        start !== undefined
        && previous !== undefined
        && position !== previous + 1
      ) {
        segments.push(createSegment(line, start, previous + 1));
        start = position;
      }

      previous = position;
    }

    if (start !== undefined && previous !== undefined) {
      segments.push(createSegment(line, start, previous + 1));
    }
  }

  return segments;
}

/**
 * Башня, по кольцу стены которой щёлкнули, и угол проёма на нём.
 *
 * @param document План.
 * @param level Этаж.
 * @param point Точка в клетках.
 * @param tolerance Насколько можно промахнуться мимо середины кольца.
 * @returns Башня и угол, кратный шагу, или undefined.
 */
export function findTowerRing(
  document: PlanDocument,
  level: number,
  point: PlanCell,
  tolerance: number,
): { room: PlanRoom; angle: number } | undefined {
  for (const room of document.rooms) {
    if (room.kind !== 'TOWER' || room.level !== level || !room.shape) {
      continue;
    }

    const { cx, cy } = room.shape;
    const distance = Math.hypot(point.x - cx, point.y - cy);

    if (Math.abs(distance - getTowerRingRadius(room.shape)) > tolerance) {
      continue;
    }

    const degrees = (Math.atan2(point.y - cy, point.x - cx) * 180) / Math.PI;
    const step = PLAN_LIMITS.towerAngleStep;
    const snapped = Math.round(degrees / step) * step;

    return { room, angle: ((snapped % 360) + 360) % 360 };
  }

  return undefined;
}

/**
 * Радиус середины кольца стены башни: стена лежит снаружи окружности пола.
 *
 * @param circle Окружность пола башни.
 * @returns Радиус в клетках.
 */
export function getTowerRingRadius(circle: PlanCircle): number {
  return circle.r + 0.25;
}

/**
 * Точка на середине кольца стены башни под углом.
 *
 * @param circle Окружность пола башни.
 * @param angle Угол в градусах от востока по часовой.
 * @returns Точка в клетках.
 */
export function getTowerRingPoint(circle: PlanCircle, angle: number): PlanCell {
  const radians = (angle * Math.PI) / 180;
  const radius = getTowerRingRadius(circle);

  return {
    x: circle.cx + Math.cos(radians) * radius,
    y: circle.cy + Math.sin(radians) * radius,
  };
}

/**
 * Клетки отрезка без диагональных скачков: коридор не рвётся на углах.
 *
 * @param from Начальная клетка (в результат не входит).
 * @param to Конечная клетка.
 * @returns Клетки по порядку.
 */
export function getLineCells(from: PlanCell, to: PlanCell): Array<PlanCell> {
  const cells: Array<PlanCell> = [];

  let { x, y } = from;

  while (x !== to.x || y !== to.y) {
    if (Math.abs(to.x - x) >= Math.abs(to.y - y)) {
      x += Math.sign(to.x - x);
    } else {
      y += Math.sign(to.y - y);
    }

    cells.push({ x, y });
  }

  return cells;
}

/**
 * Точка подписи комнаты: середина комнаты, а если она выпадает из комнаты
 * (буква Г), — ближайшая к середине клетка комнаты.
 *
 * @param room Комната.
 * @returns Точка в клетках или undefined у пустой комнаты.
 */
export function getRoomLabelPoint(room: PlanRoom): PlanCell | undefined {
  if (room.shape) {
    return { x: room.shape.cx, y: room.shape.cy + room.shape.r / 2 };
  }

  if (!room.cells.length) {
    return undefined;
  }

  const middleX =
    room.cells.reduce((sum, cell) => sum + cell.x + 0.5, 0) / room.cells.length;

  const middleY =
    room.cells.reduce((sum, cell) => sum + cell.y + 0.5, 0) / room.cells.length;

  const isInside = room.cells.some(
    (cell) => cell.x === Math.floor(middleX) && cell.y === Math.floor(middleY),
  );

  if (isInside) {
    return { x: middleX, y: middleY };
  }

  const nearest = room.cells.reduce((best, cell) =>
    Math.hypot(cell.x + 0.5 - middleX, cell.y + 0.5 - middleY)
    < Math.hypot(best.x + 0.5 - middleX, best.y + 0.5 - middleY)
      ? cell
      : best,
  );

  return { x: nearest.x + 0.5, y: nearest.y + 0.5 };
}

/**
 * Середина всех комнат этажа — куда смотреть на старте.
 *
 * @param document План.
 * @param level Этаж.
 * @returns Точка в клетках или undefined на пустом этаже.
 */
export function getLevelCenter(
  document: PlanDocument,
  level: number,
): PlanCell | undefined {
  const cells = document.rooms
    .filter((room) => room.level === level)
    .flatMap((room) => room.cells);

  if (!cells.length) {
    return undefined;
  }

  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);

  return {
    x: (Math.min(...xs) + Math.max(...xs) + 1) / 2,
    y: (Math.min(...ys) + Math.max(...ys) + 1) / 2,
  };
}
