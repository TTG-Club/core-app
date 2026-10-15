import type { Container, Graphics, Text } from 'pixi.js';

import type { PlanPoint, PlanPreview } from '../composables/usePlanInteraction';
import type { PlanTheme } from '../composables/usePlanTheme';
import type {
  CellSide,
  DoorKind,
  FurnitureKind,
  PlanArea,
  PlanCell,
  PlanCircle,
  PlanDocument,
  PlanEdge,
  PlanFurniture,
  PlanOccupancy,
  PlanRoom,
  PlanSegment,
  PlanStair,
  PlanTool,
} from '../model';

import { fillTemplate } from '~bastions/model';

import {
  findFurnitureAt,
  findTowerRing,
  getBoundarySegments,
  getCanonicalEdge,
  getCellAt,
  getCellKey,
  getEdgeCells,
  getFurnitureSize,
  getNearestEdge,
  getOccupancy,
  getRoomLabelPoint,
  getTowerRingPoint,
  getTowerStairFrame,
  isDefenseWallCell,
  isWallEdge,
  PLAN_CELL_PIXELS,
  PLAN_FEET_PER_CELL,
  PLAN_FURNITURE_SIZES,
  PLAN_HIT_TOLERANCE,
  PLAN_LABELS,
  PLAN_LIMITS,
  PLAN_SHAPES,
  snapToHalf,
} from '../model';

const CELL = PLAN_CELL_PIXELS;

/** Шаг штриховки стен башни и защитной стены, доля клетки. */
const HATCH_STEP = 0.22;
/** Пунктир: длина штриха и промежутка, доля клетки. */
const DASH = { dash: 0.18, gap: 0.14 } as const;
/** Точки края двора: шаг и радиус, доля клетки. */
const DOTS = { step: 0.2, radius: 0.035 } as const;

/** Направление подъёма лестницы как единичный вектор. */
const DIRECTION_VECTORS: Record<CellSide, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};

/** Подписи на холсте держат размер на экране, пикселей. */
const LABEL_SIZES = { room: 13, note: 11, mark: 12 } as const;

/** Что рисуется на холсте. */
export interface PlanScene {
  document: PlanDocument;
  level: number;
  tool: PlanTool;
  selectedRoomId: string | undefined;
  facilityColors: ReadonlyMap<string, number>;
  facilityAreas: ReadonlyMap<string, { used: number; squares: number }>;
  preview: PlanPreview | undefined;
  hoverPoint: PlanPoint | undefined;
  /** Указатели соавторов на этом этаже. */
  cursors: ReadonlyArray<PlanCursor>;
  /** Выделенный участок на этом этаже. */
  area: PlanArea | undefined;
  /** Какую мебель ставит инструмент «Мебель». */
  furnitureKind: FurnitureKind;
  /** Поворот, с которым инструмент «Мебель» поставит новый предмет. */
  furnitureRotation: number;
  /** Заданная сторона винтовой лестницы; undefined — наибольшая. */
  spiralSide: number | undefined;
}

/** Указатель соавтора. */
export interface PlanCursor {
  point: PlanPoint;
  name: string;
  color: number;
}

/** Слои холста: миллиметровка перерисовывается только при смене темы. */
export interface PlanLayers {
  grid: Graphics;
  content: Graphics;
  overlay: Graphics;
  labels: Container;
}

/** Оформление подписи. */
export interface PlanTextStyle {
  color: number;
  size: number;
  isBold: boolean;
}

/** Конструктор подписи: PixiJS загружается динамически, класс приходит снаружи. */
export type TextFactory = (text: string, style: PlanTextStyle) => Text;

/** Всё, что нужно функциям рисования одного кадра. */
interface DrawContext {
  graphics: Graphics;
  theme: PlanTheme;
  scale: number;
  /** Толщина стены в пикселях мира: не тоньше 3 пикселей экрана. */
  wallWidth: number;
  /** Линия в один пиксель экрана. */
  hairline: number;
  addLabel: (text: string, point: PlanCell, style: PlanTextStyle) => void;
}

/**
 * Рисует миллиметровку участка: тонкие линии каждой клетки, заметнее —
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
    grid.moveTo(index * CELL, 0).lineTo(index * CELL, length);
    grid.moveTo(0, index * CELL).lineTo(length, index * CELL);
  }

  grid.stroke({ color: theme.grid, width: 1, pixelLine: true, alpha: 0.6 });

  for (let index = 0; index <= size; index += 5) {
    grid.moveTo(index * CELL, 0).lineTo(index * CELL, length);
    grid.moveTo(0, index * CELL).lineTo(length, index * CELL);
  }

  grid.stroke({
    color: theme.gridMajor,
    width: 1,
    pixelLine: true,
    alpha: 0.6,
  });
}

/**
 * Пунктирная линия: PixiJS не умеет пунктир, штрихи строятся вручную.
 *
 * @param graphics Слой.
 * @param segment Отрезок в клетках.
 */
function traceDashedLine(graphics: Graphics, segment: PlanSegment): void {
  const length = Math.hypot(
    segment.toX - segment.fromX,
    segment.toY - segment.fromY,
  );

  const unitX = (segment.toX - segment.fromX) / length;
  const unitY = (segment.toY - segment.fromY) / length;

  for (let start = 0; start < length; start += DASH.dash + DASH.gap) {
    const end = Math.min(length, start + DASH.dash);

    graphics
      .moveTo(
        (segment.fromX + unitX * start) * CELL,
        (segment.fromY + unitY * start) * CELL,
      )
      .lineTo(
        (segment.fromX + unitX * end) * CELL,
        (segment.fromY + unitY * end) * CELL,
      );
  }
}

/**
 * Пунктирная окружность — тень башни с другого этажа.
 *
 * @param graphics Слой.
 * @param circle Окружность в клетках.
 */
function traceDashedCircle(graphics: Graphics, circle: PlanCircle): void {
  const length = 2 * Math.PI * circle.r;
  const count = Math.max(8, Math.round(length / (DASH.dash + DASH.gap)));
  const sweep = (2 * Math.PI) / count;
  const share = DASH.dash / (DASH.dash + DASH.gap);

  for (let index = 0; index < count; index++) {
    const from = index * sweep;

    graphics
      .moveTo(
        (circle.cx + Math.cos(from) * circle.r) * CELL,
        (circle.cy + Math.sin(from) * circle.r) * CELL,
      )
      .arc(
        circle.cx * CELL,
        circle.cy * CELL,
        circle.r * CELL,
        from,
        from + sweep * share,
      );
  }
}

/**
 * Полигон прямоугольника, повёрнутого вдоль стены.
 *
 * @param center Середина в клетках.
 * @param angle Угол оси вдоль стены, радианы.
 * @param length Длина вдоль стены, клеток.
 * @param thickness Толщина поперёк стены, клеток.
 * @returns Вершины в пикселях мира.
 */
function getRotatedRect(
  center: PlanCell,
  angle: number,
  length: number,
  thickness: number,
): Array<number> {
  const alongX = Math.cos(angle);
  const alongY = Math.sin(angle);
  const acrossX = -alongY;
  const acrossY = alongX;
  const halfLength = length / 2;
  const halfThickness = thickness / 2;

  return [
    [-halfLength, -halfThickness],
    [halfLength, -halfThickness],
    [halfLength, halfThickness],
    [-halfLength, halfThickness],
  ].flatMap(([along = 0, across = 0]) => [
    (center.x + alongX * along + acrossX * across) * CELL,
    (center.y + alongY * along + acrossY * across) * CELL,
  ]);
}

/**
 * Рисует дверь поперёк стены.
 *
 * @param context Кадр.
 * @param center Середина двери в клетках.
 * @param angle Угол оси вдоль стены, радианы.
 * @param kind Вид двери.
 */
function drawDoor(
  context: DrawContext,
  center: PlanCell,
  angle: number,
  kind: DoorKind,
): void {
  const { graphics, theme, hairline } = context;
  const wall = context.wallWidth / CELL;
  const length = PLAN_SHAPES.doorLength;
  const thickness = Math.max(PLAN_SHAPES.doorThickness, wall * 1.4);

  if (kind === 'SECRET') {
    graphics
      .circle(center.x * CELL, center.y * CELL, thickness * 0.8 * CELL)
      .fill({ color: theme.background });

    context.addLabel(PLAN_LABELS.secretDoorMark, center, {
      color: theme.text,
      size: LABEL_SIZES.mark,
      isBold: true,
    });

    return;
  }

  if (kind === 'ARCH' || kind === 'PORTCULLIS') {
    graphics
      .poly(getRotatedRect(center, angle, length, wall * 1.3))
      .fill({ color: theme.background });

    if (kind === 'ARCH') {
      for (const end of [-1, 1]) {
        const tip = {
          x: center.x + (Math.cos(angle) * end * length) / 2,
          y: center.y + (Math.sin(angle) * end * length) / 2,
        };

        graphics.poly(
          getRotatedRect(tip, angle + Math.PI / 2, wall * 1.6, wall),
        );
      }

      graphics.fill({ color: theme.text });

      return;
    }

    for (let index = 0; index < 5; index++) {
      const offset = -length / 2 + 0.08 + (index * (length - 0.16)) / 4;

      graphics.circle(
        (center.x + Math.cos(angle) * offset) * CELL,
        (center.y + Math.sin(angle) * offset) * CELL,
        Math.max(0.05 * CELL, hairline * 1.5),
      );
    }

    graphics.fill({ color: theme.text });

    return;
  }

  graphics
    .poly(getRotatedRect(center, angle, length, thickness))
    .fill({ color: theme.background })
    .stroke({ color: theme.text, width: hairline * 1.5 });

  if (kind === 'LOCKED') {
    graphics
      .poly(getRotatedRect(center, angle, 0.14, 0.14))
      .fill({ color: theme.text });
  }
}

/**
 * Рисует окно в стене: просвет с рамой и стеклом посередине.
 *
 * @param context Кадр.
 * @param center Середина окна в клетках.
 * @param angle Угол оси вдоль стены, радианы.
 */
function drawWindow(
  context: DrawContext,
  center: PlanCell,
  angle: number,
): void {
  const { graphics, theme, hairline } = context;
  const wall = context.wallWidth / CELL;
  const length = PLAN_SHAPES.windowLength;

  graphics
    .poly(getRotatedRect(center, angle, length, wall * 1.2))
    .fill({ color: theme.background });

  graphics
    .poly(
      getRotatedRect(
        center,
        angle,
        length,
        Math.max(PLAN_SHAPES.windowThickness, wall),
      ),
    )
    .stroke({ color: theme.text, width: hairline * 1.3 });

  graphics
    .moveTo(
      (center.x - (Math.cos(angle) * length) / 2) * CELL,
      (center.y - (Math.sin(angle) * length) / 2) * CELL,
    )
    .lineTo(
      (center.x + (Math.cos(angle) * length) / 2) * CELL,
      (center.y + (Math.sin(angle) * length) / 2) * CELL,
    )
    .stroke({ color: theme.text, width: hairline });
}

/**
 * Середина ребра и угол стены на нём.
 *
 * @param edge Ребро.
 * @returns Точка в клетках и угол оси вдоль стены.
 */
function getEdgePlacement(edge: PlanEdge): { center: PlanCell; angle: number } {
  const canonical = getCanonicalEdge(edge);

  return canonical.side === 'N'
    ? { center: { x: canonical.x + 0.5, y: canonical.y }, angle: 0 }
    : { center: { x: canonical.x, y: canonical.y + 0.5 }, angle: Math.PI / 2 };
}

/**
 * Рисует круглую башню: штрихованное кольцо стены, пол с сеткой внутри.
 *
 * @param context Кадр.
 * @param circle Окружность пола.
 * @param isSelected Выбрана ли башня.
 */
function drawTower(
  context: DrawContext,
  circle: PlanCircle,
  isSelected: boolean,
): void {
  const { graphics, theme, hairline } = context;
  const centerX = circle.cx * CELL;
  const centerY = circle.cy * CELL;
  const inner = circle.r;
  const outer = circle.r + PLAN_SHAPES.towerWallWidth;

  graphics
    .circle(centerX, centerY, outer * CELL)
    .fill({ color: theme.background });

  // Штриховка кольца: короткие косые штрихи от внутренней окружности к
  // внешней со сдвигом по углу — как каменная кладка на картах.
  const count = Math.round((2 * Math.PI * outer) / HATCH_STEP);

  for (let index = 0; index < count; index++) {
    const angle = (index / count) * 2 * Math.PI;
    const skew = HATCH_STEP / outer;

    graphics
      .moveTo(
        centerX + Math.cos(angle) * inner * CELL,
        centerY + Math.sin(angle) * inner * CELL,
      )
      .lineTo(
        centerX + Math.cos(angle + skew) * outer * CELL,
        centerY + Math.sin(angle + skew) * outer * CELL,
      );
  }

  graphics.stroke({ color: theme.text, width: hairline, alpha: 0.7 });

  graphics.circle(centerX, centerY, inner * CELL).fill({
    color: isSelected ? theme.accent : theme.background,
    alpha: isSelected ? 0.14 : 1,
  });

  // Сетка пола внутри окружности: концы хорд считаются, маска не нужна.
  for (
    let line = Math.ceil(circle.cx - inner);
    line <= circle.cx + inner;
    line++
  ) {
    const half = Math.sqrt(
      Math.max(0, inner * inner - (line - circle.cx) ** 2),
    );

    graphics
      .moveTo(line * CELL, (circle.cy - half) * CELL)
      .lineTo(line * CELL, (circle.cy + half) * CELL);
  }

  for (
    let line = Math.ceil(circle.cy - inner);
    line <= circle.cy + inner;
    line++
  ) {
    const half = Math.sqrt(
      Math.max(0, inner * inner - (line - circle.cy) ** 2),
    );

    graphics
      .moveTo((circle.cx - half) * CELL, line * CELL)
      .lineTo((circle.cx + half) * CELL, line * CELL);
  }

  graphics.stroke({ color: theme.grid, width: 1, pixelLine: true });

  graphics
    .circle(centerX, centerY, inner * CELL)
    .stroke({ color: theme.text, width: hairline * 2.5 })
    .circle(centerX, centerY, outer * CELL)
    .stroke({ color: theme.text, width: hairline * 2.5 });
}

/**
 * Толстая стена квадратной башни по её краю: полоса толщиной со стену
 * круглой башни, с обводкой и той же штриховкой, что у кольца. Полоса идёт
 * по рёбрам клеток, как обычная стена, — двери и окна встают в неё так же.
 *
 * @param context Кадр.
 * @param room Квадратная башня.
 * @param level Этаж.
 */
function drawSquareTowerWall(
  context: DrawContext,
  room: PlanRoom,
  level: number,
): void {
  const { graphics, theme, hairline } = context;
  const band = PLAN_SHAPES.towerWallWidth;
  const outline = hairline * 2.5;

  const segments = getBoundarySegments(
    new Map(room.cells.map((cell) => [getCellKey(cell.x, cell.y), room])),
    level,
    'wall',
  );

  const traceSegments = () => {
    for (const segment of segments) {
      graphics
        .moveTo(segment.fromX * CELL, segment.fromY * CELL)
        .lineTo(segment.toX * CELL, segment.toY * CELL);
    }
  };

  // Квадратные концы закрывают углы: обводка — широкой линией цвета стен,
  // полоса — линией цвета бумаги поверх неё.
  traceSegments();

  graphics.stroke({
    color: theme.text,
    width: band * CELL + outline * 2,
    cap: 'square',
  });

  traceSegments();

  graphics.stroke({
    color: theme.background,
    width: band * CELL,
    cap: 'square',
  });

  for (const segment of segments) {
    const length = Math.hypot(
      segment.toX - segment.fromX,
      segment.toY - segment.fromY,
    );

    const alongX = (segment.toX - segment.fromX) / length;
    const alongY = (segment.toY - segment.fromY) / length;

    for (let offset = 0; offset < length; offset += HATCH_STEP) {
      const x = segment.fromX + alongX * offset;
      const y = segment.fromY + alongY * offset;

      // Поперёк полосы со сдвигом вдоль неё — как штрихи кольца башни.
      graphics
        .moveTo(
          (x - alongY * (band / 2)) * CELL,
          (y + alongX * (band / 2)) * CELL,
        )
        .lineTo(
          (x + alongX * HATCH_STEP + alongY * (band / 2)) * CELL,
          (y + alongY * HATCH_STEP - alongX * (band / 2)) * CELL,
        );
    }
  }

  graphics.stroke({ color: theme.text, width: hairline, alpha: 0.7 });
}

/** Сколько ступеней в витке винтовой лестницы и какую долю круга они занимают. */
const SPIRAL_STEPS = 10;
const SPIRAL_SWEEP = (Math.PI * 5) / 3;

/**
 * Рисует винтовую лестницу: круг, центральный столб, ступени-клинья на
 * пять шестых витка (остаток — площадка) и дугу со стрелкой по ходу подъёма.
 * Первая ступень смотрит в сторону `direction`, подъём идёт по часовой.
 *
 * @param context Кадр.
 * @param stair Лестница.
 */
function drawSpiralStair(context: DrawContext, stair: PlanStair): void {
  const { graphics, theme, hairline } = context;
  const centerX = (stair.x + stair.width / 2) * CELL;
  const centerY = (stair.y + stair.height / 2) * CELL;
  const radius = (Math.min(stair.width, stair.height) / 2 - 0.08) * CELL;
  const newel = Math.min(0.14 * CELL, radius * 0.25);
  const [unitX, unitY] = DIRECTION_VECTORS[stair.direction];
  const start = Math.atan2(unitY, unitX);

  graphics
    .circle(centerX, centerY, radius)
    .fill({ color: theme.background })
    .stroke({ color: theme.text, width: hairline * 1.4 });

  for (let index = 0; index <= SPIRAL_STEPS; index++) {
    const angle = start + (index / SPIRAL_STEPS) * SPIRAL_SWEEP;

    graphics
      .moveTo(
        centerX + Math.cos(angle) * newel,
        centerY + Math.sin(angle) * newel,
      )
      .lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
      );
  }

  graphics.stroke({ color: theme.text, width: hairline });

  const path = radius * 0.62;
  const end = start + SPIRAL_SWEEP;
  const tipX = centerX + Math.cos(end) * path;
  const tipY = centerY + Math.sin(end) * path;
  // Касательная по часовой стрелке и нормаль к ней — для наконечника.
  const alongX = -Math.sin(end);
  const alongY = Math.cos(end);
  const wing = Math.min(0.2 * CELL, radius * 0.3);

  graphics
    .moveTo(centerX + Math.cos(start) * path, centerY + Math.sin(start) * path)
    .arc(centerX, centerY, path, start, end)
    .moveTo(
      tipX - alongX * wing + Math.cos(end) * wing * 0.6,
      tipY - alongY * wing + Math.sin(end) * wing * 0.6,
    )
    .lineTo(tipX, tipY)
    .lineTo(
      tipX - alongX * wing - Math.cos(end) * wing * 0.6,
      tipY - alongY * wing - Math.sin(end) * wing * 0.6,
    )
    .stroke({ color: theme.text, width: hairline * 1.6 });

  graphics.circle(centerX, centerY, newel).fill({ color: theme.text });
}

/**
 * Рисует лестницу: ступени поперёк подъёма и стрелку, у винтовой — круг со
 * ступенями-клиньями. Подпись «Вверх» или «Вниз» — у нижнего конца.
 *
 * @param context Кадр.
 * @param stair Лестница.
 */
function drawStair(context: DrawContext, stair: PlanStair): void {
  const { graphics, theme, hairline } = context;
  const left = stair.x * CELL;
  const top = stair.y * CELL;
  const width = stair.width * CELL;
  const height = stair.height * CELL;
  const isVertical = stair.direction === 'N' || stair.direction === 'S';
  const centerX = stair.x + stair.width / 2;
  const centerY = stair.y + stair.height / 2;

  const caption =
    stair.toLevel > stair.level ? PLAN_LABELS.stairUp : PLAN_LABELS.stairDown;

  const note = { color: theme.text, size: LABEL_SIZES.note, isBold: true };

  if (stair.kind === 'SPIRAL') {
    drawSpiralStair(context, stair);

    context.addLabel(
      caption,
      { x: centerX, y: stair.y + stair.height + 0.35 },
      note,
    );

    return;
  }

  graphics
    .rect(left, top, width, height)
    .fill({ color: theme.background })
    .stroke({ color: theme.text, width: hairline * 1.4 });

  const along = isVertical ? stair.height : stair.width;
  const steps = Math.max(3, Math.round(along * PLAN_SHAPES.stepsPerCell));

  for (let index = 1; index < steps; index++) {
    const share = index / steps;

    if (isVertical) {
      graphics
        .moveTo(left, top + share * height)
        .lineTo(left + width, top + share * height);
    } else {
      graphics
        .moveTo(left + share * width, top)
        .lineTo(left + share * width, top + height);
    }
  }

  graphics.stroke({ color: theme.text, width: hairline });

  const [unitX, unitY] = DIRECTION_VECTORS[stair.direction];
  const reach = (along / 2) * 0.7;
  const tipX = centerX + unitX * reach;
  const tipY = centerY + unitY * reach;
  const wing = 0.18;

  graphics
    .moveTo((centerX - unitX * reach) * CELL, (centerY - unitY * reach) * CELL)
    .lineTo(tipX * CELL, tipY * CELL)
    .moveTo(
      (tipX - unitX * wing - unitY * wing) * CELL,
      (tipY - unitY * wing + unitX * wing) * CELL,
    )
    .lineTo(tipX * CELL, tipY * CELL)
    .lineTo(
      (tipX - unitX * wing + unitY * wing) * CELL,
      (tipY - unitY * wing - unitX * wing) * CELL,
    )
    .stroke({ color: theme.text, width: hairline * 2 });

  context.addLabel(
    caption,
    {
      x: centerX - unitX * (stair.width / 2 + 0.6),
      y: centerY - unitY * (stair.height / 2 + 0.4),
    },
    note,
  );
}

/**
 * Лестница с другого этажа, которая приходит сюда: пунктирная рамка, у
 * винтовой — пунктирный круг.
 *
 * @param context Кадр.
 * @param stair Лестница.
 */
function drawArrivingStair(context: DrawContext, stair: PlanStair): void {
  const { graphics, theme, hairline } = context;

  if (stair.kind === 'SPIRAL') {
    traceDashedCircle(graphics, {
      cx: stair.x + stair.width / 2,
      cy: stair.y + stair.height / 2,
      r: Math.min(stair.width, stair.height) / 2 - 0.08,
    });

    graphics.stroke({ color: theme.muted, width: hairline * 1.4 });

    context.addLabel(
      stair.toLevel > stair.level ? PLAN_LABELS.stairDown : PLAN_LABELS.stairUp,
      { x: stair.x + stair.width / 2, y: stair.y + stair.height / 2 },
      { color: theme.muted, size: LABEL_SIZES.note, isBold: true },
    );

    return;
  }

  const inset = 0.08;
  const right = stair.x + stair.width - inset;
  const bottom = stair.y + stair.height - inset;
  const left = stair.x + inset;
  const top = stair.y + inset;

  for (const segment of [
    { fromX: left, fromY: top, toX: right, toY: top },
    { fromX: right, fromY: top, toX: right, toY: bottom },
    { fromX: right, fromY: bottom, toX: left, toY: bottom },
    { fromX: left, fromY: bottom, toX: left, toY: top },
  ]) {
    traceDashedLine(graphics, segment);
  }

  graphics.stroke({ color: theme.muted, width: hairline * 1.4 });

  context.addLabel(
    stair.toLevel > stair.level ? PLAN_LABELS.stairDown : PLAN_LABELS.stairUp,
    { x: stair.x + stair.width / 2, y: stair.y + stair.height / 2 },
    { color: theme.muted, size: LABEL_SIZES.note, isBold: true },
  );
}

/**
 * Защитная стена: клетки с косой штриховкой и обводкой по краю. Ворота —
 * проём без штриховки с косяками по краям и двумя створками поперёк прохода.
 *
 * @param context Кадр.
 * @param document План.
 */
function drawDefenseWalls(context: DrawContext, document: PlanDocument): void {
  const { graphics, theme, hairline } = context;

  const gates = new Set(
    document.defenseGates.map((cell) => getCellKey(cell.x, cell.y)),
  );

  const solid = document.defenseWalls.filter(
    (cell) => !gates.has(getCellKey(cell.x, cell.y)),
  );

  const cells = new Set(solid.map((cell) => getCellKey(cell.x, cell.y)));

  for (const cell of solid) {
    graphics.rect(cell.x * CELL, cell.y * CELL, CELL, CELL);
  }

  graphics.fill({ color: theme.shade, alpha: 0.5 });

  for (const cell of solid) {
    for (let offset = HATCH_STEP * 2; offset < 2; offset += HATCH_STEP * 2) {
      const startX = Math.max(0, offset - 1);
      const startY = Math.min(1, offset);
      const endX = Math.min(1, offset);
      const endY = Math.max(0, offset - 1);

      graphics
        .moveTo((cell.x + startX) * CELL, (cell.y + startY) * CELL)
        .lineTo((cell.x + endX) * CELL, (cell.y + endY) * CELL);
    }
  }

  graphics.stroke({ color: theme.text, width: hairline, alpha: 0.6 });

  for (const cell of solid) {
    const sides: Array<[boolean, number, number, number, number]> = [
      [!cells.has(getCellKey(cell.x, cell.y - 1)), 0, 0, 1, 0],
      [!cells.has(getCellKey(cell.x, cell.y + 1)), 0, 1, 1, 1],
      [!cells.has(getCellKey(cell.x - 1, cell.y)), 0, 0, 0, 1],
      [!cells.has(getCellKey(cell.x + 1, cell.y)), 1, 0, 1, 1],
    ];

    for (const [isOuter, fromX, fromY, toX, toY] of sides) {
      if (isOuter) {
        graphics
          .moveTo((cell.x + fromX) * CELL, (cell.y + fromY) * CELL)
          .lineTo((cell.x + toX) * CELL, (cell.y + toY) * CELL);
      }
    }
  }

  graphics.stroke({ color: theme.text, width: hairline * 2 });

  const walls = new Set(
    document.defenseWalls.map((cell) => getCellKey(cell.x, cell.y)),
  );

  for (const gate of document.defenseGates) {
    drawDefenseGate(context, gate, walls, gates);
  }
}

/**
 * Ворота в клетке защитной стены. Стена идёт вдоль соседних клеток стены,
 * проход — поперёк неё; створки сходятся посередине клетки.
 *
 * @param context Кадр.
 * @param gate Клетка ворот.
 * @param walls Ключи всех клеток стены, с воротами.
 * @param gates Ключи клеток с воротами.
 */
function drawDefenseGate(
  context: DrawContext,
  gate: PlanCell,
  walls: ReadonlySet<string>,
  gates: ReadonlySet<string>,
): void {
  const { graphics, theme, hairline } = context;

  const isAlongX =
    walls.has(getCellKey(gate.x - 1, gate.y))
    || walls.has(getCellKey(gate.x + 1, gate.y))
    || !(
      walls.has(getCellKey(gate.x, gate.y - 1))
      || walls.has(getCellKey(gate.x, gate.y + 1))
    );

  const left = gate.x * CELL;
  const top = gate.y * CELL;
  const middle = 0.5 * CELL;
  const leaf = 0.12 * CELL;
  const outline = { color: theme.text, width: hairline * 2 };

  graphics
    .rect(left, top, CELL, CELL)
    .fill({ color: theme.background, alpha: 0.9 });

  if (isAlongX) {
    graphics
      .rect(left + hairline, top + middle - leaf, middle - hairline, leaf)
      .rect(left + middle, top + middle - leaf, middle - hairline, leaf)
      .fill({ color: theme.shade })
      .stroke(outline);
  } else {
    graphics
      .rect(left + middle - leaf, top + hairline, leaf, middle - hairline)
      .rect(left + middle - leaf, top + middle, leaf, middle - hairline)
      .fill({ color: theme.shade })
      .stroke(outline);
  }

  // Косяки — везде, кроме стыка с соседними воротами: широкие ворота из
  // нескольких клеток читаются одним проёмом.
  const sides: Array<[number, number, number, number, number, number]> =
    isAlongX
      ? [
          [-1, 0, 0, 0, 0, 1],
          [1, 0, 1, 0, 1, 1],
        ]
      : [
          [0, -1, 0, 0, 1, 0],
          [0, 1, 0, 1, 1, 1],
        ];

  for (const [stepX, stepY, fromX, fromY, toX, toY] of sides) {
    if (!gates.has(getCellKey(gate.x + stepX, gate.y + stepY))) {
      graphics
        .moveTo((gate.x + fromX) * CELL, (gate.y + fromY) * CELL)
        .lineTo((gate.x + toX) * CELL, (gate.y + toY) * CELL);
    }
  }

  graphics.stroke({ color: theme.text, width: hairline * 3 });
}

/**
 * Тень ближайшего нижнего этажа пунктиром — чтобы совмещать стены и лестницы.
 *
 * @param context Кадр.
 * @param document План.
 * @param level Текущий этаж.
 */
function drawLevelBelow(
  context: DrawContext,
  document: PlanDocument,
  level: number,
): void {
  const below = document.levels
    .filter((item) => item < level)
    .sort((first, second) => second - first)[0];

  if (below === undefined) {
    return;
  }

  const { graphics, theme, hairline } = context;
  const occupancy = getOccupancy(document, below);

  for (const segment of getBoundarySegments(occupancy, below, 'wall')) {
    traceDashedLine(graphics, segment);
  }

  for (const room of document.rooms) {
    if (room.level === below && room.shape) {
      traceDashedCircle(graphics, {
        ...room.shape,
        r: room.shape.r + PLAN_SHAPES.towerWallWidth / 2,
      });
    }
  }

  graphics.stroke({ color: theme.muted, width: hairline * 1.5, alpha: 0.5 });
}

/**
 * Пол комнат на сетке: бумага, у двора — серая заливка, у комнат с
 * сооружением — лёгкий оттенок его цвета, у выбранной — акцент.
 *
 * @param context Кадр.
 * @param rooms Комнаты этажа.
 * @param scene Сцена.
 */
function drawFloors(
  context: DrawContext,
  rooms: ReadonlyArray<PlanRoom>,
  scene: PlanScene,
): void {
  const { graphics, theme } = context;

  for (const room of rooms) {
    if (room.kind === 'TOWER') {
      continue;
    }

    for (const cell of room.cells) {
      graphics.rect(cell.x * CELL, cell.y * CELL, CELL, CELL);
    }

    graphics.fill({
      color: room.kind === 'COURTYARD' ? theme.shade : theme.background,
    });

    const tint = room.facilityId
      ? scene.facilityColors.get(room.facilityId)
      : undefined;

    const isSelected = room.id === scene.selectedRoomId;

    if (tint === undefined && !isSelected) {
      continue;
    }

    for (const cell of room.cells) {
      graphics.rect(cell.x * CELL, cell.y * CELL, CELL, CELL);
    }

    graphics.fill({
      color: isSelected ? theme.accent : (tint ?? theme.accent),
      alpha: isSelected ? 0.16 : 0.08,
    });
  }

  for (const room of rooms) {
    if (room.kind === 'TOWER' || room.kind === 'COURTYARD') {
      continue;
    }

    for (const cell of room.cells) {
      graphics.rect(cell.x * CELL, cell.y * CELL, CELL, CELL);
    }
  }

  graphics.stroke({ color: theme.grid, width: 1, pixelLine: true });
}

/**
 * Стены по границам комнат и пунктир по краю дворов.
 *
 * @param context Кадр.
 * @param occupancy Клетки этажа.
 * @param level Этаж.
 */
function drawWalls(
  context: DrawContext,
  occupancy: PlanOccupancy,
  level: number,
): void {
  const { graphics, theme } = context;

  for (const segment of getBoundarySegments(occupancy, level, 'wall')) {
    graphics
      .moveTo(segment.fromX * CELL, segment.fromY * CELL)
      .lineTo(segment.toX * CELL, segment.toY * CELL);
  }

  graphics.stroke({
    color: theme.text,
    width: context.wallWidth,
    cap: 'square',
  });

  for (const segment of getBoundarySegments(occupancy, level, 'edge')) {
    const length = Math.hypot(
      segment.toX - segment.fromX,
      segment.toY - segment.fromY,
    );

    for (let offset = DOTS.step / 2; offset < length; offset += DOTS.step) {
      const share = offset / length;

      graphics.circle(
        (segment.fromX + (segment.toX - segment.fromX) * share) * CELL,
        (segment.fromY + (segment.toY - segment.fromY) * share) * CELL,
        Math.max(DOTS.radius * CELL, context.hairline),
      );
    }
  }

  graphics.fill({ color: theme.text });
}

/**
 * Подписи комнат: название и, если стоит сооружение, его площадь.
 *
 * @param context Кадр.
 * @param rooms Комнаты этажа.
 * @param scene Сцена.
 */
function drawRoomLabels(
  context: DrawContext,
  rooms: ReadonlyArray<PlanRoom>,
  scene: PlanScene,
): void {
  const { theme, scale } = context;

  for (const room of rooms) {
    const point = getRoomLabelPoint(room);

    if (!point || (room.kind === 'CORRIDOR' && !room.facilityId)) {
      continue;
    }

    context.addLabel(room.name, point, {
      color: theme.text,
      size: LABEL_SIZES.room,
      isBold: true,
    });

    const area = room.facilityId
      ? scene.facilityAreas.get(room.facilityId)
      : undefined;

    if (area) {
      context.addLabel(
        fillTemplate(PLAN_LABELS.areaLabel, {
          used: area.used,
          max: area.squares,
        }),
        { x: point.x, y: point.y + (LABEL_SIZES.room * 1.3) / (CELL * scale) },
        {
          color: area.used > area.squares ? theme.error : theme.muted,
          size: LABEL_SIZES.note,
          isBold: false,
        },
      );
    }
  }
}

/**
 * Рисует план на текущем этаже.
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

  content.clear();
  overlay.clear();

  for (const label of labels.removeChildren()) {
    label.destroy();
  }

  const context: DrawContext = {
    graphics: content,
    theme,
    scale,
    wallWidth: Math.max(PLAN_SHAPES.wallWidth * CELL, 3 / scale),
    hairline: 1 / scale,
    addLabel: (text, point, style) => {
      const label = createText(text, style);

      // Подпись держит размер на экране при любом масштабе: масштаб слоя
      // компенсируется обратным масштабом самой подписи.
      label.anchor.set(0.5);
      label.scale.set(1 / scale);
      label.position.set(point.x * CELL, point.y * CELL);
      labels.addChild(label);
    },
  };

  const rooms = document.rooms.filter((room) => room.level === level);
  const occupancy = getOccupancy(document, level);

  drawLevelBelow(context, document, level);

  if (level === 0) {
    drawDefenseWalls(context, document);
  }

  drawFloors(context, rooms, scene);
  drawWalls(context, occupancy, level);

  for (const room of rooms) {
    if (room.kind === 'SQUARE_TOWER') {
      drawSquareTowerWall(context, room, level);
    } else if (room.shape) {
      drawTower(context, room.shape, room.id === scene.selectedRoomId);
    }
  }

  for (const stair of document.stairs) {
    if (stair.toLevel === level) {
      drawArrivingStair(context, stair);
    }
  }

  for (const stair of document.stairs) {
    if (stair.level === level) {
      drawStair(context, stair);
    }
  }

  for (const column of document.columns) {
    if (column.level === level) {
      content
        .circle(
          column.x * CELL,
          column.y * CELL,
          PLAN_SHAPES.columnRadius * CELL,
        )
        .fill({ color: theme.background })
        .stroke({ color: theme.text, width: context.hairline * 2 });
    }
  }

  for (const item of document.furniture) {
    if (item.level === level) {
      drawFurniture(context, item);
    }
  }

  const towerWallContext = {
    ...context,
    wallWidth: PLAN_SHAPES.towerWallWidth * CELL,
  };

  /**
   * Кадр для двери или окна: в стене квадратной башни они шире, по её
   * толщине.
   *
   * @param edge Ребро.
   * @returns Кадр.
   */
  const getEdgeContext = (edge: PlanEdge): DrawContext =>
    getEdgeCells(edge).some(
      (cell) =>
        occupancy.get(getCellKey(cell.x, cell.y))?.kind === 'SQUARE_TOWER',
    )
      ? towerWallContext
      : context;

  for (const door of document.doors) {
    if (door.level === level) {
      const { center, angle } = getEdgePlacement(door);

      drawDoor(getEdgeContext(door), center, angle, door.kind);
    }
  }

  for (const window of document.windows) {
    if (window.level === level) {
      const { center, angle } = getEdgePlacement(window);

      drawWindow(getEdgeContext(window), center, angle);
    }
  }

  for (const opening of document.towerOpenings) {
    const tower = rooms.find((room) => room.id === opening.roomId);

    if (!tower?.shape) {
      continue;
    }

    const center = getTowerRingPoint(tower.shape, opening.angle);
    const angle = (opening.angle * Math.PI) / 180 + Math.PI / 2;

    if (opening.type === 'WINDOW') {
      drawWindow(towerWallContext, center, angle);
    } else if (opening.kind) {
      drawDoor(towerWallContext, center, angle, opening.kind);
    }
  }

  drawRoomLabels(context, rooms, scene);
  drawOverlay({ ...context, graphics: overlay }, scene, occupancy);

  if (scene.area) {
    drawArea({ ...context, graphics: overlay }, scene.area);
  }

  drawCursors({ ...context, graphics: overlay }, scene.cursors);
}

/**
 * Указатели соавторов: точка их цвета и имя рядом.
 *
 * @param context Кадр со слоем подсказок.
 * @param cursors Указатели.
 */
function drawCursors(
  context: DrawContext,
  cursors: ReadonlyArray<PlanCursor>,
): void {
  const { graphics, hairline, theme } = context;

  for (const { point, name, color } of cursors) {
    graphics
      .circle(point.x * CELL, point.y * CELL, hairline * 5)
      .fill({ color })
      .stroke({ color: theme.background, width: hairline * 2 });

    // Имя — под точкой, чтобы не закрывать место, куда указывают. Отступ
    // задан в пикселях экрана и переведён в клетки.
    context.addLabel(
      name,
      { x: point.x, y: point.y + (hairline * 20) / CELL },
      { color, size: LABEL_SIZES.note, isBold: true },
    );
  }
}

/**
 * Подсказки поверх плана: черновик жеста и место под указателем.
 *
 * @param context Кадр со слоем подсказок.
 * @param scene Сцена.
 * @param occupancy Клетки этажа.
 */
function drawOverlay(
  context: DrawContext,
  scene: PlanScene,
  occupancy: PlanOccupancy,
): void {
  const { graphics, theme, hairline } = context;
  const { preview, hoverPoint } = scene;
  const accent = { color: theme.accent, width: hairline * 2 };

  if (preview?.kind === 'rect') {
    const left = Math.min(preview.from.x, preview.to.x);
    const top = Math.min(preview.from.y, preview.to.y);
    const width = Math.abs(preview.to.x - preview.from.x) + 1;
    const height = Math.abs(preview.to.y - preview.from.y) + 1;

    graphics
      .rect(left * CELL, top * CELL, width * CELL, height * CELL)
      .fill({ color: theme.accent, alpha: 0.15 })
      .stroke(accent);

    if (preview.label) {
      context.addLabel(
        preview.label,
        { x: left + width / 2, y: top - 0.5 },
        {
          color: theme.accent,
          size: LABEL_SIZES.note,
          isBold: true,
        },
      );
    }

    return;
  }

  if (preview?.kind === 'circle') {
    const { circle } = preview;

    graphics
      .circle(circle.cx * CELL, circle.cy * CELL, circle.r * CELL)
      .fill({ color: theme.accent, alpha: 0.15 })
      .stroke(accent);

    context.addLabel(
      preview.label,
      { x: circle.cx, y: circle.cy },
      {
        color: theme.accent,
        size: LABEL_SIZES.note,
        isBold: true,
      },
    );

    return;
  }

  if (preview?.kind === 'move') {
    for (const cell of preview.cells) {
      graphics.rect(cell.x * CELL, cell.y * CELL, CELL, CELL);
    }

    graphics.fill({
      color: preview.isValid ? theme.accent : theme.error,
      alpha: 0.25,
    });

    return;
  }

  if (hoverPoint) {
    drawHover(context, scene, occupancy, hoverPoint);
  }
}

/**
 * Где сработает инструмент: ребро стены, кольцо башни, точка колонны или
 * клетка.
 *
 * @param context Кадр со слоем подсказок.
 * @param scene Сцена.
 * @param occupancy Клетки этажа.
 * @param point Точка под указателем.
 */
function drawHover(
  context: DrawContext,
  scene: PlanScene,
  occupancy: PlanOccupancy,
  point: PlanPoint,
): void {
  const { graphics, theme, hairline } = context;

  switch (scene.tool) {
    case 'select':
    case 'pan':
      return;
    case 'door':
    case 'window': {
      const cell = getCellAt(point);

      // Дверь в защитной стене становится воротами — подсвечивается клетка.
      if (
        scene.tool === 'door'
        && scene.level === 0
        && isDefenseWallCell(scene.document, cell)
      ) {
        graphics
          .rect(cell.x * CELL, cell.y * CELL, CELL, CELL)
          .stroke({ color: theme.accent, width: hairline * 2 });

        return;
      }

      const ring = findTowerRing(
        scene.document,
        scene.level,
        point,
        PLAN_HIT_TOLERANCE.tower,
      );

      if (ring?.room.shape) {
        const center = getTowerRingPoint(ring.room.shape, ring.angle);

        graphics
          .circle(center.x * CELL, center.y * CELL, 0.4 * CELL)
          .stroke({ color: theme.accent, width: hairline * 2 });

        return;
      }

      const edge = getNearestEdge(scene.level, point);
      const { center, angle } = getEdgePlacement(edge);

      graphics.poly(getRotatedRect(center, angle, 0.8, 0.2)).stroke({
        color: isWallEdge(occupancy, edge) ? theme.accent : theme.error,
        width: hairline * 2,
      });

      return;
    }
    case 'column':
      graphics
        .circle(
          snapToHalf(point.x) * CELL,
          snapToHalf(point.y) * CELL,
          PLAN_SHAPES.columnRadius * CELL,
        )
        .stroke({ color: theme.accent, width: hairline * 2 });

      return;
    case 'furniture': {
      const existing = findFurnitureAt(scene.document, scene.level, point);
      const cell = getCellAt(point);

      const footprint = existing ?? {
        ...cell,
        id: '',
        level: scene.level,
        kind: scene.furnitureKind,
        rotation: scene.furnitureRotation,
      };

      // Новый предмет виден целиком — так понятно, как он встанет.
      if (!existing) {
        drawFurniture(context, footprint);
      }

      const { width, depth } = getFurnitureSize(footprint);

      graphics
        .rect(
          footprint.x * CELL,
          footprint.y * CELL,
          width * CELL,
          depth * CELL,
        )
        .stroke({ color: theme.accent, width: hairline * 2 });

      return;
    }
    case 'stairs': {
      const frame = getTowerStairFrame(
        scene.document,
        scene.level,
        point,
        scene.spiralSide,
      );

      if (frame) {
        graphics
          .circle(
            (frame.x + frame.width / 2) * CELL,
            (frame.y + frame.height / 2) * CELL,
            (Math.min(frame.width, frame.height) / 2) * CELL,
          )
          .stroke({ color: theme.accent, width: hairline * 2 });

        context.addLabel(
          fillTemplate(PLAN_LABELS.feet, {
            feet: Math.min(frame.width, frame.height) * PLAN_FEET_PER_CELL,
          }),
          {
            x: frame.x + frame.width / 2,
            y: frame.y + frame.height / 2,
          },
          { color: theme.accent, size: LABEL_SIZES.note, isBold: true },
        );

        return;
      }

      graphics
        .rect(
          Math.floor(point.x) * CELL,
          Math.floor(point.y) * CELL,
          CELL,
          CELL,
        )
        .stroke({ color: theme.accent, width: hairline * 1.5, alpha: 0.8 });

      return;
    }
    case 'room':
    case 'tower':
    case 'area':
    case 'corridor':
    case 'eraser':
    case 'wall':
      graphics
        .rect(
          Math.floor(point.x) * CELL,
          Math.floor(point.y) * CELL,
          CELL,
          CELL,
        )
        .stroke({ color: theme.accent, width: hairline * 1.5, alpha: 0.8 });
  }
}

/**
 * Выделенный участок: рамка и лёгкая заливка цветом акцента.
 *
 * @param context Кадр со слоем подсказок.
 * @param area Участок.
 */
function drawArea(context: DrawContext, area: PlanArea): void {
  const { graphics, theme, hairline } = context;
  const left = Math.min(area.from.x, area.to.x);
  const top = Math.min(area.from.y, area.to.y);
  const width = Math.abs(area.to.x - area.from.x) + 1;
  const height = Math.abs(area.to.y - area.from.y) + 1;

  graphics
    .rect(left * CELL, top * CELL, width * CELL, height * CELL)
    .fill({ color: theme.accent, alpha: 0.12 })
    .stroke({ color: theme.accent, width: hairline * 2 });
}

/** Прямоугольник в долях клетки внутри предмета мебели без поворота. */
interface FurniturePart {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Круг или овал, вписанный в прямоугольник части. */
  isRound?: boolean;
}

/**
 * Круглая часть предмета.
 *
 * @param x Левый край.
 * @param y Верхний край.
 * @param size Поперечник.
 * @returns Часть.
 */
function roundPart(x: number, y: number, size: number): FurniturePart {
  return { x, y, width: size, height: size, isRound: true };
}

/**
 * Тонкая черта поперёк или вдоль предмета.
 *
 * @param x Левый край.
 * @param y Верхний край.
 * @param width Ширина.
 * @param height Высота.
 * @returns Часть.
 */
function linePart(
  x: number,
  y: number,
  width: number,
  height: number,
): FurniturePart {
  return { x, y, width, height };
}

/**
 * Переводит часть предмета из его собственных координат (без поворота) в
 * координаты холста с учётом поворота по часовой стрелке.
 *
 * @param item Предмет.
 * @param part Часть в клетках от угла предмета.
 * @returns Прямоугольник на холсте, пикселей.
 */
function placeFurniturePart(
  item: PlanFurniture,
  part: FurniturePart,
): FurniturePart {
  const size = PLAN_FURNITURE_SIZES[item.kind];

  const corners = [
    { x: part.x, y: part.y },
    { x: part.x + part.width, y: part.y + part.height },
  ].map(({ x, y }) => {
    switch (item.rotation) {
      case 90:
        return { x: size.depth - y, y: x };
      case 180:
        return { x: size.width - x, y: size.depth - y };
      case 270:
        return { x: y, y: size.width - x };
      default:
        return { x, y };
    }
  });

  const [first = { x: 0, y: 0 }, second = { x: 0, y: 0 }] = corners;

  return {
    x: (item.x + Math.min(first.x, second.x)) * CELL,
    y: (item.y + Math.min(first.y, second.y)) * CELL,
    width: Math.abs(second.x - first.x) * CELL,
    height: Math.abs(second.y - first.y) * CELL,
    isRound: part.isRound,
  };
}

/**
 * Части предмета мебели в его собственных координатах: корпус и детали,
 * по которым предмет узнаётся на плане. Спинка дивана и стула и изголовье
 * кровати — у верхней стороны (y = 0).
 *
 * @param kind Вид мебели.
 * @returns Корпус и детали.
 */
function getFurnitureParts(kind: FurnitureKind): {
  body: FurniturePart;
  details: Array<FurniturePart>;
} {
  const { width, depth } = PLAN_FURNITURE_SIZES[kind];
  const inset = 0.12;

  const body = {
    x: inset,
    y: inset,
    width: width - inset * 2,
    height: depth - inset * 2,
  };

  switch (kind) {
    case 'CHAIR':
      return {
        body: { x: 0.22, y: 0.22, width: 0.56, height: 0.56 },
        details: [{ x: 0.22, y: 0.22, width: 0.56, height: 0.12 }],
      };
    case 'SOFA':
      return {
        body,
        details: [
          { x: inset, y: inset, width: width - inset * 2, height: 0.25 },
          { x: inset, y: inset, width: 0.2, height: depth - inset * 2 },
          {
            x: width - inset - 0.2,
            y: inset,
            width: 0.2,
            height: depth - inset * 2,
          },
        ],
      };
    case 'BED':
      return {
        body,
        details: [
          { x: 0.25, y: 0.22, width: width - 0.5, height: 0.3 },
          { x: inset, y: 0.75, width: width - inset * 2, height: 0.01 },
        ],
      };
    case 'WARDROBE':
      return {
        body: { x: inset, y: inset, width: width - inset * 2, height: 0.6 },
        details: [{ x: width / 2, y: inset, width: 0.01, height: 0.6 }],
      };
    case 'CHEST':
      return {
        body: { x: 0.15, y: 0.25, width: 0.7, height: 0.5 },
        details: [
          { x: 0.15, y: 0.25, width: 0.7, height: 0.16 },
          { x: 0.44, y: 0.41, width: 0.12, height: 0.12 },
        ],
      };
    default:
      return getPremiumFurnitureParts(kind, body);
  }
}

/**
 * Части предметов интерьера по подписке: статуи, фонтаны, мастерские и сад.
 *
 * @param kind Вид предмета.
 * @param body Корпус по умолчанию — прямоугольник с отступом.
 * @returns Корпус и детали.
 */
function getPremiumFurnitureParts(
  kind: FurnitureKind,
  body: FurniturePart,
): { body: FurniturePart; details: Array<FurniturePart> } {
  switch (kind) {
    case 'STATUE':
      return {
        body: { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
        details: [roundPart(0.3, 0.3, 0.4)],
      };
    case 'FOUNTAIN':
      return {
        body: roundPart(0.1, 0.1, 1.8),
        details: [roundPart(0.45, 0.45, 1.1), roundPart(0.85, 0.85, 0.3)],
      };
    case 'ALTAR':
      return {
        body: { x: 0.15, y: 0.25, width: 1.7, height: 0.5 },
        details: [roundPart(0.85, 0.35, 0.3)],
      };
    case 'THRONE':
      return {
        body: { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
        details: [
          linePart(0.15, 0.15, 0.7, 0.2),
          linePart(0.15, 0.15, 0.12, 0.7),
          linePart(0.73, 0.15, 0.12, 0.7),
        ],
      };
    case 'BOOKSHELF':
      return {
        body: { x: 0.12, y: 0.12, width: 1.76, height: 0.4 },
        details: [
          linePart(0.7, 0.12, 0.01, 0.4),
          linePart(1.3, 0.12, 0.01, 0.4),
        ],
      };
    case 'FIREPLACE':
      return {
        body: { x: 0.12, y: 0.12, width: 1.76, height: 0.6 },
        details: [linePart(0.5, 0.12, 1, 0.4)],
      };
    case 'DINING_TABLE':
      return {
        body: { x: 0.3, y: 0.4, width: 3.4, height: 1.2 },
        details: [0.6, 1.75, 2.9].flatMap((x) => [
          linePart(x, 0.05, 0.5, 0.3),
          linePart(x, 1.65, 0.5, 0.3),
        ]),
      };
    case 'BARREL':
      return {
        body: roundPart(0.15, 0.15, 0.7),
        details: [roundPart(0.35, 0.35, 0.3)],
      };
    case 'PANTRY_RACK':
      return {
        body: { x: 0.12, y: 0.12, width: 1.76, height: 0.5 },
        details: [
          linePart(0.12, 0.37, 1.76, 0.01),
          linePart(1, 0.12, 0.01, 0.5),
        ],
      };
    case 'WORKBENCH':
      return {
        body: { x: 0.12, y: 0.2, width: 1.76, height: 0.6 },
        details: [linePart(0.2, 0.2, 0.3, 0.15), linePart(1, 0.5, 0.6, 0.01)],
      };
    case 'ANVIL':
      return {
        body: { x: 0.3, y: 0.35, width: 0.5, height: 0.3 },
        details: [
          linePart(0.12, 0.42, 0.18, 0.16),
          linePart(0.4, 0.65, 0.3, 0.15),
        ],
      };
    case 'ALCHEMY_TABLE':
      return {
        body,
        details: [
          roundPart(0.3, 0.35, 0.25),
          roundPart(0.75, 0.4, 0.2),
          roundPart(1.3, 0.32, 0.35),
        ],
      };
    case 'WEAPON_RACK':
      return {
        body: { x: 0.12, y: 0.35, width: 1.76, height: 0.3 },
        details: [0.55, 1, 1.45].map((x) => linePart(x, 0.2, 0.01, 0.6)),
      };
    case 'TRAINING_DUMMY':
      return {
        body: roundPart(0.3, 0.3, 0.4),
        details: [linePart(0.12, 0.45, 0.76, 0.1)],
      };
    case 'CAGE':
      return {
        body,
        details: [0.55, 1, 1.45].map((x) => linePart(x, 0.12, 0.01, 1.76)),
      };
    case 'RUG':
      return {
        body: { x: 0.1, y: 0.1, width: 2.8, height: 1.8 },
        details: [linePart(0.3, 0.3, 2.4, 1.4)],
      };
    case 'TAPESTRY':
      return {
        body: { x: 0.12, y: 0.05, width: 1.76, height: 0.18 },
        details: [linePart(0.12, 0.3, 1.76, 0.01)],
      };
    case 'WELL':
      return {
        body: roundPart(0.1, 0.1, 0.8),
        details: [roundPart(0.25, 0.25, 0.5)],
      };
    case 'TREE':
      return {
        body: roundPart(0.05, 0.05, 1.9),
        details: [roundPart(0.8, 0.8, 0.4)],
      };
    case 'FLOWERBED':
      return {
        body: { x: 0.12, y: 0.15, width: 1.76, height: 0.7 },
        details: [
          roundPart(0.3, 0.35, 0.3),
          roundPart(0.85, 0.35, 0.3),
          roundPart(1.4, 0.35, 0.3),
        ],
      };
    case 'TELESCOPE':
      return {
        body: roundPart(0.3, 0.3, 0.4),
        details: [linePart(0.44, 0.06, 0.12, 0.6)],
      };
    case 'MAGIC_CIRCLE':
      return {
        body: roundPart(0.1, 0.1, 2.8),
        details: [roundPart(0.4, 0.4, 2.2), linePart(0.85, 0.85, 1.3, 1.3)],
      };
    default:
      return { body, details: [] };
  }
}

/**
 * Обводит часть предмета: прямоугольник или вписанный овал.
 *
 * @param graphics Слой.
 * @param part Часть в пикселях.
 * @returns Тот же слой для заливки и обводки.
 */
function tracePart(graphics: Graphics, part: FurniturePart): Graphics {
  return part.isRound
    ? graphics.ellipse(
        part.x + part.width / 2,
        part.y + part.height / 2,
        part.width / 2,
        part.height / 2,
      )
    : graphics.rect(part.x, part.y, part.width, part.height);
}

/**
 * Рисует предмет мебели: корпус цветом листа с тонкой обводкой и детали.
 *
 * @param context Кадр.
 * @param item Предмет.
 */
function drawFurniture(context: DrawContext, item: PlanFurniture): void {
  const { graphics, theme, hairline } = context;
  const { body, details } = getFurnitureParts(item.kind);
  const outline = { color: theme.text, width: hairline * 1.4 };
  const placedBody = placeFurniturePart(item, body);

  tracePart(graphics, placedBody)
    .fill({ color: theme.background })
    .stroke(outline);

  for (const detail of details) {
    tracePart(graphics, placeFurniturePart(item, detail)).stroke(outline);
  }
}
