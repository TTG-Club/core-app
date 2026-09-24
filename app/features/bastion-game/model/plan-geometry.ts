import type { CellSide, PlanCell, PlanOutline } from './plan-schema';

/** Точность сравнения: центр ровно на окружности считается внутри. */
const EPSILON = 1e-9;

export interface PlanBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Прямоугольник, в который вписан контур.
 *
 * @param outline Контур корпуса.
 * @returns Границы в клетках.
 */
export function getOutlineBounds(outline: PlanOutline): PlanBounds {
  switch (outline.type) {
    case 'CIRCLE':
      return {
        minX: outline.cx - outline.r,
        minY: outline.cy - outline.r,
        maxX: outline.cx + outline.r,
        maxY: outline.cy + outline.r,
      };
    case 'RECTANGLE':
      return {
        minX: outline.x,
        minY: outline.y,
        maxX: outline.x + outline.width,
        maxY: outline.y + outline.height,
      };
    default:
      return {
        minX: Math.min(...outline.points.map(([x]) => x)),
        minY: Math.min(...outline.points.map(([, y]) => y)),
        maxX: Math.max(...outline.points.map(([x]) => x)),
        maxY: Math.max(...outline.points.map(([, y]) => y)),
      };
  }
}

/**
 * Лежит ли точка внутри многоугольника (чётно-нечётное правило).
 *
 * @param points Вершины.
 * @param pointX Точка, x.
 * @param pointY Точка, y.
 * @returns true, если внутри.
 */
function polygonContains(
  points: ReadonlyArray<[number, number]>,
  pointX: number,
  pointY: number,
): boolean {
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]!;
    const [xj, yj] = points[j]!;

    const crosses =
      yi > pointY !== yj > pointY
      && pointX < ((xj - xi) * (pointY - yi)) / (yj - yi) + xi;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Лежит ли точка внутри контура.
 *
 * @param outline Контур.
 * @param pointX Точка, x (в клетках).
 * @param pointY Точка, y (в клетках).
 * @returns true, если внутри.
 */
export function outlineContains(
  outline: PlanOutline,
  pointX: number,
  pointY: number,
): boolean {
  switch (outline.type) {
    case 'CIRCLE': {
      const dx = pointX - outline.cx;
      const dy = pointY - outline.cy;

      return dx * dx + dy * dy <= outline.r * outline.r + EPSILON;
    }
    case 'RECTANGLE':
      return (
        pointX >= outline.x
        && pointX <= outline.x + outline.width
        && pointY >= outline.y
        && pointY <= outline.y + outline.height
      );
    default:
      return polygonContains(outline.points, pointX, pointY);
  }
}

/**
 * Клетки корпуса: те, чей центр лежит внутри контура. Правило совпадает с
 * серверным `PlanGeometry` — иначе счётчики площади на экране разошлись бы с
 * проверкой при сохранении.
 *
 * @param outline Контур корпуса.
 * @returns Клетки в порядке строк.
 */
export function getCellsInside(outline: PlanOutline): Array<PlanCell> {
  const bounds = getOutlineBounds(outline);
  const cells: Array<PlanCell> = [];

  for (let y = Math.floor(bounds.minY); y < Math.ceil(bounds.maxY); y++) {
    for (let x = Math.floor(bounds.minX); x < Math.ceil(bounds.maxX); x++) {
      if (outlineContains(outline, x + 0.5, y + 0.5)) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

/**
 * Клетка корпуса ли это: её центр внутри контура.
 *
 * @param outline Контур корпуса.
 * @param cell Клетка.
 * @returns true, если клетка входит в корпус.
 */
export function isCellInside(outline: PlanOutline, cell: PlanCell): boolean {
  return outlineContains(outline, cell.x + 0.5, cell.y + 0.5);
}

/**
 * Клетка под точкой холста.
 *
 * @param pointX Точка, x (в клетках, дробное).
 * @param pointY Точка, y (в клетках, дробное).
 * @returns Клетка.
 */
export function getCellAt(pointX: number, pointY: number): PlanCell {
  return { x: Math.floor(pointX), y: Math.floor(pointY) };
}

/**
 * Ближайшее к точке ребро клетки — на него встаёт дверь или окно.
 *
 * @param pointX Точка, x (в клетках, дробное).
 * @param pointY Точка, y (в клетках, дробное).
 * @returns Клетка и сторона.
 */
export function getNearestEdge(
  pointX: number,
  pointY: number,
): PlanCell & { side: CellSide } {
  const cell = getCellAt(pointX, pointY);
  const offsetX = pointX - cell.x;
  const offsetY = pointY - cell.y;

  const distances: Array<[CellSide, number]> = [
    ['N', offsetY],
    ['S', 1 - offsetY],
    ['W', offsetX],
    ['E', 1 - offsetX],
  ];

  const [side] = distances.reduce((nearest, candidate) =>
    candidate[1] < nearest[1] ? candidate : nearest,
  );

  return { ...cell, side };
}

/**
 * Привязывает координату к сетке с заданным шагом.
 *
 * @param value Координата в клетках.
 * @param step Шаг: 1 — углы клеток, 0.5 — ещё и середины.
 * @returns Координата на сетке.
 */
export function snapToGrid(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Центр прямоугольника, в который вписан контур.
 *
 * @param outline Контур.
 * @returns Центр в клетках.
 */
export function getOutlineCenter(outline: PlanOutline): PlanCell {
  const bounds = getOutlineBounds(outline);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}
