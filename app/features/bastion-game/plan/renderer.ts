import type { Container, Graphics, Text } from 'pixi.js';

import type { PlanDraft } from '../composables/usePlanInteraction';
import type { PlanTheme } from '../composables/usePlanTheme';
import type {
  CellSide,
  PlanCell,
  PlanDocument,
  PlanDoor,
  PlanOutline,
} from '../model';

import { PLAN_CELL_PIXELS, PLAN_LIMITS } from '../model';

const CELL = PLAN_CELL_PIXELS;

/** Что рисуется на холсте. */
export interface PlanScene {
  document: PlanDocument;
  level: number;
  selectedBuildingId: string | undefined;
  facilityColors: ReadonlyMap<string, number>;
  draft: PlanDraft | undefined;
  hoverCell: PlanCell | undefined;
}

/** Слои холста: сетка перерисовывается только при смене темы. */
export interface PlanLayers {
  grid: Graphics;
  content: Graphics;
  overlay: Graphics;
  labels: Container;
}

/** Конструктор подписи: PixiJS загружается динамически, класс приходит снаружи. */
export type TextFactory = (text: string, color: number) => Text;

/**
 * Рисует сетку участка: тонкие линии каждой клетки и более заметные —
 * каждые 5 клеток (25 футов).
 *
 * @param grid Слой сетки.
 * @param theme Цвета темы.
 */
export function drawGrid(grid: Graphics, theme: PlanTheme): void {
  const size = PLAN_LIMITS.gridSize;
  const length = size * CELL;

  grid.clear();
  grid.rect(0, 0, length, length).fill({ color: theme.background });

  for (let index = 0; index <= size; index++) {
    if (index % 5 !== 0) {
      grid.moveTo(index * CELL, 0).lineTo(index * CELL, length);
      grid.moveTo(0, index * CELL).lineTo(length, index * CELL);
    }
  }

  grid.stroke({ color: theme.grid, width: 1, pixelLine: true });

  for (let index = 0; index <= size; index += 5) {
    grid.moveTo(index * CELL, 0).lineTo(index * CELL, length);
    grid.moveTo(0, index * CELL).lineTo(length, index * CELL);
  }

  grid.stroke({ color: theme.gridMajor, width: 1, pixelLine: true });
}

/**
 * Добавляет путь контура в клетках.
 *
 * @param graphics Слой.
 * @param outline Контур.
 */
function traceOutline(graphics: Graphics, outline: PlanOutline): void {
  switch (outline.type) {
    case 'CIRCLE':
      graphics.circle(outline.cx * CELL, outline.cy * CELL, outline.r * CELL);

      break;
    case 'RECTANGLE':
      graphics.rect(
        outline.x * CELL,
        outline.y * CELL,
        outline.width * CELL,
        outline.height * CELL,
      );

      break;
    case 'POLYGON':
      graphics.poly(
        outline.points.flatMap(([x, y]) => [x * CELL, y * CELL]),
        true,
      );

      break;
  }
}

/**
 * Концы ребра клетки в пикселях: на ребре стоят двери и окна.
 *
 * @param cell Клетка.
 * @param side Сторона.
 * @param inset Отступ от углов, доля клетки.
 * @returns Начало и конец отрезка.
 */
function getEdgeSegment(
  cell: PlanCell,
  side: CellSide,
  inset: number,
): [number, number, number, number] {
  const left = (cell.x + inset) * CELL;
  const right = (cell.x + 1 - inset) * CELL;
  const top = (cell.y + inset) * CELL;
  const bottom = (cell.y + 1 - inset) * CELL;

  switch (side) {
    case 'N':
      return [left, cell.y * CELL, right, cell.y * CELL];
    case 'S':
      return [left, (cell.y + 1) * CELL, right, (cell.y + 1) * CELL];
    case 'W':
      return [cell.x * CELL, top, cell.x * CELL, bottom];
    default:
      return [(cell.x + 1) * CELL, top, (cell.x + 1) * CELL, bottom];
  }
}

/**
 * Цвет двери по её виду: запертая и решётка заметнее, секретная — приглушена.
 *
 * @param door Дверь.
 * @param theme Цвета темы.
 * @returns Цвет и прозрачность.
 */
function getDoorStyle(
  door: PlanDoor,
  theme: PlanTheme,
): { color: number; alpha: number } {
  switch (door.kind) {
    case 'LOCKED':
      return { color: theme.warning, alpha: 1 };
    case 'SECRET':
      return { color: theme.muted, alpha: 0.6 };
    case 'PORTCULLIS':
      return { color: theme.text, alpha: 1 };
    default:
      return { color: theme.accent, alpha: 1 };
  }
}

/**
 * Рисует план на текущем уровне. Корпуса без этажа на этом уровне видны
 * пунктиром-тенью, чтобы совмещать переходы между этажами.
 *
 * @param layers Слои холста.
 * @param scene Что рисовать.
 * @param theme Цвета темы.
 * @param scale Текущий масштаб холста — толщина линий не должна от него зависеть.
 * @param createText Конструктор подписей.
 */
export function drawPlan(
  layers: PlanLayers,
  scene: PlanScene,
  theme: PlanTheme,
  scale: number,
  createText: TextFactory,
): void {
  const { content, overlay, labels } = layers;
  const { document, level } = scene;
  const lineWidth = 2 / scale;

  content.clear();
  overlay.clear();

  for (const label of labels.removeChildren()) {
    label.destroy();
  }

  if (level === 0) {
    for (const wall of document.walls) {
      content.rect(wall.x * CELL, wall.y * CELL, CELL, CELL);
    }

    content.fill({ color: theme.text, alpha: 0.55 });
  }

  for (const passage of document.passages) {
    if (passage.level !== level) {
      continue;
    }

    for (const cell of passage.cells) {
      content.rect(cell.x * CELL, cell.y * CELL, CELL, CELL);
    }

    content.fill({ color: theme.muted, alpha: 0.3 });
  }

  for (const building of document.buildings) {
    const floor = building.floors.find((item) => item.level === level);
    const isSelected = building.id === scene.selectedBuildingId;

    if (!floor) {
      traceOutline(content, building.outline);
      content.stroke({ color: theme.muted, width: lineWidth, alpha: 0.35 });

      continue;
    }

    traceOutline(content, building.outline);
    content.fill({ color: theme.background, alpha: 0.6 });

    for (const cell of floor.cells) {
      content.rect(cell.x * CELL, cell.y * CELL, CELL, CELL).fill({
        color: scene.facilityColors.get(cell.facilityId) ?? theme.muted,
        alpha: 0.85,
      });
    }

    for (const stair of floor.stairs) {
      for (let step = 1; step < 4; step++) {
        content
          .moveTo(stair.x * CELL + 3, (stair.y + step / 4) * CELL)
          .lineTo((stair.x + 1) * CELL - 3, (stair.y + step / 4) * CELL);
      }

      content.stroke({ color: theme.text, width: 1, pixelLine: true });
    }

    traceOutline(content, building.outline);

    content.stroke({
      color: isSelected ? theme.accent : theme.text,
      width: isSelected ? lineWidth * 1.5 : lineWidth,
    });

    for (const door of floor.doors) {
      const [x1, y1, x2, y2] = getEdgeSegment(door, door.side, 0.2);
      const style = getDoorStyle(door, theme);

      content.moveTo(x1, y1).lineTo(x2, y2);
      content.stroke({ ...style, width: lineWidth * 2.5 });
    }

    for (const window of floor.windows) {
      const [x1, y1, x2, y2] = getEdgeSegment(window, window.side, 0.3);

      content.moveTo(x1, y1).lineTo(x2, y2);
      content.stroke({ color: theme.background, width: lineWidth * 2 });
      content.moveTo(x1, y1).lineTo(x2, y2);
      content.stroke({ color: theme.muted, width: 1, pixelLine: true });
    }

    // Подпись держит размер на экране при любом масштабе: масштаб слоя
    // компенсируется обратным масштабом самой подписи.
    const text = createText(building.name, theme.text);

    text.anchor.set(0.5, 1);
    text.scale.set(1 / scale);
    text.position.set(...getLabelPosition(building.outline));
    labels.addChild(text);
  }

  drawOverlay(overlay, scene, theme, lineWidth);
}

/**
 * Точка подписи корпуса — над его контуром, по центру.
 *
 * @param outline Контур.
 * @returns Координаты в пикселях.
 */
function getLabelPosition(outline: PlanOutline): [number, number] {
  switch (outline.type) {
    case 'CIRCLE':
      return [outline.cx * CELL, (outline.cy - outline.r) * CELL - 4];
    case 'RECTANGLE':
      return [(outline.x + outline.width / 2) * CELL, outline.y * CELL - 4];
    default: {
      const xs = outline.points.map(([x]) => x);
      const top = Math.min(...outline.points.map(([, y]) => y));

      return [((Math.min(...xs) + Math.max(...xs)) / 2) * CELL, top * CELL - 4];
    }
  }
}

/**
 * Черновик корпуса и клетка под указателем.
 *
 * @param overlay Слой поверх плана.
 * @param scene Что рисовать.
 * @param theme Цвета темы.
 * @param lineWidth Толщина линии в координатах мира.
 */
function drawOverlay(
  overlay: Graphics,
  scene: PlanScene,
  theme: PlanTheme,
  lineWidth: number,
): void {
  if (scene.hoverCell) {
    overlay
      .rect(scene.hoverCell.x * CELL, scene.hoverCell.y * CELL, CELL, CELL)
      .stroke({ color: theme.accent, width: 1, pixelLine: true, alpha: 0.8 });
  }

  const { draft } = scene;

  if (!draft) {
    return;
  }

  if (draft.kind === 'outline') {
    traceOutline(overlay, draft.outline);
    overlay.fill({ color: theme.accent, alpha: 0.15 });
    traceOutline(overlay, draft.outline);
    overlay.stroke({ color: theme.accent, width: lineWidth });

    return;
  }

  const points = draft.cursor ? [...draft.points, draft.cursor] : draft.points;
  const [first, ...rest] = points;

  if (!first) {
    return;
  }

  overlay.moveTo(first[0] * CELL, first[1] * CELL);

  for (const [x, y] of rest) {
    overlay.lineTo(x * CELL, y * CELL);
  }

  overlay.stroke({ color: theme.accent, width: lineWidth });

  for (const [x, y] of draft.points) {
    overlay
      .circle(x * CELL, y * CELL, 3 * lineWidth)
      .fill({ color: theme.accent });
  }
}
