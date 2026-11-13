import type { ScreenPickerPlacement, ScreenWindow } from './schemas';
import type {
  ScreenDirection,
  ScreenLayout,
  ScreenLayoutTarget,
  ScreenLayoutZone,
  ScreenPoint,
  ScreenRect,
  ScreenResizeEdges,
  ScreenSize,
  ScreenSplitter,
  ScreenTile,
  ScreenWindowRequest,
} from './types';

import { clamp, minBy, sortBy, uniq } from 'es-toolkit';

import {
  DM_SCREEN_CASCADE_LENGTH,
  DM_SCREEN_CASCADE_STEP,
  DM_SCREEN_CLICK_OFFSET,
  DM_SCREEN_EDGE_DISTANCE,
  DM_SCREEN_GAP,
  DM_SCREEN_HALVES_LAYOUT,
  DM_SCREEN_MAGNET_DISTANCE,
  DM_SCREEN_MARGIN,
  DM_SCREEN_PICKER_BAND,
  DM_SCREEN_PICKER_OFFSET,
  DM_SCREEN_REACHABLE_PART,
  DM_SCREEN_SPLITTER_TOLERANCE,
  DM_SCREEN_WINDOW_HEADER_HEIGHT,
  DM_SCREEN_WINDOW_MIN_SIZE,
  DM_SCREEN_WINDOW_SIZE,
} from './constants';

/** Отрезок окна вдоль одной оси. */
interface AxisSpan {
  start: number;
  size: number;
}

/** Окно в проекции на ось движения границы и поперёк неё. */
interface AxisTile {
  id: string;
  start: number;
  end: number;
  crossStart: number;
  crossEnd: number;
}

/** Пара соседних окон и их общая часть поперёк оси. */
interface AxisNeighbours {
  before: AxisTile;
  after: AxisTile;
  from: number;
  to: number;
}

/**
 * Ограничивает значение отрезком. Если отрезок вырожден (конец раньше
 * начала — окно больше холста), побеждает начало.
 * @param coordinate - значение
 * @param min - начало отрезка
 * @param max - конец отрезка
 */
function clampFromStart(coordinate: number, min: number, max: number): number {
  return clamp(coordinate, min, Math.max(min, max));
}

/**
 * Свободное место холста: холст без отступов по краям.
 * @param board - размер холста
 */
export function getScreenArea(board: ScreenSize): ScreenRect {
  return {
    x: DM_SCREEN_MARGIN,
    y: DM_SCREEN_MARGIN,
    width: board.width - DM_SCREEN_MARGIN * 2,
    height: board.height - DM_SCREEN_MARGIN * 2,
  };
}

/**
 * Размер нового окна: обычный, но не больше свободного места холста и не
 * меньше наименьшего окна.
 * @param board - размер холста
 */
export function fitScreenWindowSize(board: ScreenSize): ScreenSize {
  const area = getScreenArea(board);

  return {
    width: Math.max(
      DM_SCREEN_WINDOW_MIN_SIZE.width,
      Math.min(DM_SCREEN_WINDOW_SIZE.width, area.width),
    ),
    height: Math.max(
      DM_SCREEN_WINDOW_MIN_SIZE.height,
      Math.min(DM_SCREEN_WINDOW_SIZE.height, area.height),
    ),
  };
}

/**
 * Место нового окна: рядом с точкой клика, а без неё — лесенкой от центра
 * холста. Окно целиком остаётся на холсте.
 * @param board - размер холста
 * @param size - размер окна
 * @param origin - точка клика на холсте
 * @param openCount - сколько окон уже развёрнуто
 */
export function placeScreenWindow(
  board: ScreenSize,
  size: ScreenSize,
  origin: ScreenPoint | undefined,
  openCount: number,
): ScreenPoint {
  const area = getScreenArea(board);

  const shift = (openCount % DM_SCREEN_CASCADE_LENGTH) * DM_SCREEN_CASCADE_STEP;

  const wanted = origin
    ? {
        x: origin.x + DM_SCREEN_CLICK_OFFSET,
        y: origin.y + DM_SCREEN_CLICK_OFFSET,
      }
    : {
        x: area.x + (area.width - size.width) / 2 + shift,
        y: area.y + (area.height - size.height) / 2 + shift,
      };

  return {
    x: Math.round(
      clampFromStart(wanted.x, area.x, area.x + area.width - size.width),
    ),
    y: Math.round(
      clampFromStart(wanted.y, area.y, area.y + area.height - size.height),
    ),
  };
}

/**
 * Место окна, с которого его ещё можно ухватить: окно может уйти за край
 * холста, но шапка остаётся видна, а с боков виден кусок окна.
 * @param position - желаемое место
 * @param size - размер окна
 * @param board - размер холста
 */
export function keepScreenWindowReachable(
  position: ScreenPoint,
  size: ScreenSize,
  board: ScreenSize,
): ScreenPoint {
  return {
    x: Math.round(
      clampFromStart(
        position.x,
        DM_SCREEN_REACHABLE_PART - size.width,
        board.width - DM_SCREEN_REACHABLE_PART,
      ),
    ),
    y: Math.round(
      clampFromStart(
        position.y,
        0,
        board.height - DM_SCREEN_WINDOW_HEADER_HEIGHT,
      ),
    ),
  };
}

/**
 * Самый верхний слой среди окон.
 * @param windows - окна ширмы
 */
export function getScreenTopLayer(
  windows: ReadonlyArray<ScreenWindow>,
): number {
  return windows.reduce(
    (top, screenWindow) => Math.max(top, screenWindow.layer),
    0,
  );
}

/**
 * Кладёт запись окном на ширму. Запись, которая на ширме уже есть, не
 * дублируется: её окно разворачивается и встаёт поверх остальных.
 * @param windows - окна ширмы
 * @param request - запись, её название и точка клика
 * @param board - размер холста
 * @param id - идентификатор нового окна
 * @returns новые окна, окно записи и появилось ли оно только что
 */
export function appendScreenWindow(
  windows: ReadonlyArray<ScreenWindow>,
  request: ScreenWindowRequest,
  board: ScreenSize,
  id: string,
): { windows: Array<ScreenWindow>; windowId: string; isAdded: boolean } {
  const layer = getScreenTopLayer(windows) + 1;

  const existing = windows.find(
    (screenWindow) => screenWindow.path === request.path,
  );

  if (existing) {
    return {
      windows: windows.map((screenWindow) =>
        screenWindow.id === existing.id
          ? { ...screenWindow, isMinimized: false, layer }
          : screenWindow,
      ),
      windowId: existing.id,
      isAdded: false,
    };
  }

  const size = fitScreenWindowSize(board);

  const position = placeScreenWindow(
    board,
    size,
    request.origin,
    windows.filter((screenWindow) => !screenWindow.isMinimized).length,
  );

  return {
    windows: [
      ...windows,
      {
        id,
        path: request.path,
        title: request.title,
        ...position,
        ...size,
        layer,
        isMinimized: false,
      },
    ],
    windowId: id,
    isAdded: true,
  };
}

/**
 * Сколько колонок в сетке окон. Клетка оценивается тем, какую долю обычного
 * окна она вмещает по худшей из сторон: так клетки не вытягиваются в
 * полосы. Сначала выбирают среди вариантов, где клетка не меньше
 * наименьшего окна; если окон слишком много и таких нет — среди всех.
 * @param count - сколько окон
 * @param area - свободное место холста
 */
function pickGridColumns(count: number, area: ScreenSize): number {
  const options = Array.from({ length: count }, (_, index) => {
    const columns = index + 1;
    const rows = Math.ceil(count / columns);
    const width = (area.width - DM_SCREEN_GAP * (columns - 1)) / columns;
    const height = (area.height - DM_SCREEN_GAP * (rows - 1)) / rows;

    return {
      columns,
      isRoomy:
        width >= DM_SCREEN_WINDOW_MIN_SIZE.width
        && height >= DM_SCREEN_WINDOW_MIN_SIZE.height,
      score: Math.min(
        width / DM_SCREEN_WINDOW_SIZE.width,
        height / DM_SCREEN_WINDOW_SIZE.height,
      ),
    };
  });

  const roomy = options.filter((option) => option.isRoomy);

  const [best] = sortBy(roomy.length ? roomy : options, [
    (option) => -option.score,
  ]);

  return best?.columns ?? 1;
}

/**
 * Раскладывает окна ровной сеткой на свободном месте холста. Меньше
 * наименьшего окна клетки не становятся: если окон слишком много, нижние
 * ряды уходят за край холста.
 * @param ids - окна в порядке чтения: слева направо, сверху вниз
 * @param board - размер холста
 */
export function arrangeScreenWindows(
  ids: ReadonlyArray<string>,
  board: ScreenSize,
): Array<ScreenTile> {
  if (!ids.length) {
    return [];
  }

  const area = getScreenArea(board);
  const columns = pickGridColumns(ids.length, area);
  const rows = Math.ceil(ids.length / columns);

  // Шаг сетки — клетка вместе с промежутком. Края клеток округляются по
  // отдельности, поэтому последняя колонка доходит ровно до края холста
  const columnStep = Math.max(
    DM_SCREEN_WINDOW_MIN_SIZE.width + DM_SCREEN_GAP,
    (area.width + DM_SCREEN_GAP) / columns,
  );

  const rowStep = Math.max(
    DM_SCREEN_WINDOW_MIN_SIZE.height + DM_SCREEN_GAP,
    (area.height + DM_SCREEN_GAP) / rows,
  );

  return ids.map((id, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = area.x + Math.round(column * columnStep);
    const y = area.y + Math.round(row * rowStep);

    return {
      id,
      x,
      y,
      width: area.x + Math.round((column + 1) * columnStep) - DM_SCREEN_GAP - x,
      height: area.y + Math.round((row + 1) * rowStep) - DM_SCREEN_GAP - y,
    };
  });
}

/**
 * Ближайшая к значению точка притяжения, если она не дальше расстояния
 * магнита; иначе значение как есть.
 * @param coordinate - где край окна сейчас
 * @param anchors - куда его можно притянуть
 */
function attractToNearest(
  coordinate: number,
  anchors: ReadonlyArray<number>,
): number {
  const nearest = minBy(
    anchors.filter(
      (anchor) => Math.abs(anchor - coordinate) <= DM_SCREEN_MAGNET_DISTANCE,
    ),
    (anchor) => Math.abs(anchor - coordinate),
  );

  return nearest ?? coordinate;
}

/**
 * Притягивает окно, которое тащат: к краям свободного места холста и к
 * другим окнам — вровень с их краями или рядом через промежуток.
 * @param rect - где окно сейчас
 * @param others - остальные развёрнутые окна
 * @param board - размер холста
 */
export function magnetScreenWindow(
  rect: ScreenRect,
  others: ReadonlyArray<ScreenRect>,
  board: ScreenSize,
): ScreenPoint {
  const area = getScreenArea(board);

  return {
    x: attractToNearest(rect.x, [
      area.x,
      area.x + area.width - rect.width,
      ...others.flatMap((other) => [
        other.x,
        other.x + other.width - rect.width,
        other.x + other.width + DM_SCREEN_GAP,
        other.x - DM_SCREEN_GAP - rect.width,
      ]),
    ]),
    y: attractToNearest(rect.y, [
      area.y,
      area.y + area.height - rect.height,
      ...others.flatMap((other) => [
        other.y,
        other.y + other.height - rect.height,
        other.y + other.height + DM_SCREEN_GAP,
        other.y - DM_SCREEN_GAP - rect.height,
      ]),
    ]),
  };
}

/**
 * Двигает одну сторону окна вдоль оси, противоположная остаётся на месте.
 * Сторона притягивается к краю свободного места, к краям соседей (вровень
 * или через промежуток) и к длине, как у соседа.
 * @param span - отрезок окна до растягивания
 * @param direction - какую сторону тянут
 * @param delta - на сколько сдвинулся указатель
 * @param area - отрезок свободного места холста по этой оси
 * @param minSize - наименьшая длина окна
 * @param neighbours - отрезки соседних окон; без них магнита нет
 */
function resizeAxisSpan(
  span: AxisSpan,
  direction: ScreenDirection,
  delta: number,
  area: AxisSpan,
  minSize: number,
  neighbours?: ReadonlyArray<AxisSpan>,
): AxisSpan {
  const end = span.start + span.size;

  if (direction === -1) {
    const wanted = span.start + delta;

    const attracted = neighbours
      ? attractToNearest(wanted, [
          area.start,
          ...neighbours.flatMap((other) => [
            other.start,
            other.start + other.size,
            other.start + other.size + DM_SCREEN_GAP,
            end - other.size,
          ]),
        ])
      : wanted;

    // Выше холста и левее него сторона не уходит; окно, которое уже там
    // стоит, обратно не выталкивается
    const start = clamp(attracted, Math.min(span.start, 0), end - minSize);

    return { start, size: end - start };
  }

  if (direction === 1) {
    const wanted = end + delta;

    const attracted = neighbours
      ? attractToNearest(wanted, [
          area.start + area.size,
          ...neighbours.flatMap((other) => [
            other.start + other.size,
            other.start,
            other.start - DM_SCREEN_GAP,
            span.start + other.size,
          ]),
        ])
      : wanted;

    return {
      start: span.start,
      size: Math.max(attracted - span.start, minSize),
    };
  }

  return span;
}

/**
 * Меняет размер окна, которое тянут за сторону или угол. Противоположные
 * стороны остаются на месте, окно не становится меньше наименьшего.
 * @param start - окно до растягивания
 * @param edges - за какие стороны тянут
 * @param delta - на сколько сдвинулся указатель
 * @param board - размер холста
 * @param others - остальные развёрнутые окна; без них магнита нет
 */
export function resizeScreenWindow(
  start: ScreenRect,
  edges: ScreenResizeEdges,
  delta: ScreenPoint,
  board: ScreenSize,
  others?: ReadonlyArray<ScreenRect>,
): ScreenRect {
  const area = getScreenArea(board);

  const horizontal = resizeAxisSpan(
    { start: start.x, size: start.width },
    edges.horizontal,
    delta.x,
    { start: area.x, size: area.width },
    DM_SCREEN_WINDOW_MIN_SIZE.width,
    others?.map((other) => ({ start: other.x, size: other.width })),
  );

  const vertical = resizeAxisSpan(
    { start: start.y, size: start.height },
    edges.vertical,
    delta.y,
    { start: area.y, size: area.height },
    DM_SCREEN_WINDOW_MIN_SIZE.height,
    others?.map((other) => ({ start: other.y, size: other.height })),
  );

  return {
    x: Math.round(horizontal.start),
    y: Math.round(vertical.start),
    width: Math.round(horizontal.size),
    height: Math.round(vertical.size),
  };
}

/**
 * Место раскладки на холсте как есть, без оглядки на наименьшее окно. Между
 * соседними местами — обычный промежуток, у краёв холста — обычный отступ.
 * @param zone - место в долях холста
 * @param board - размер холста
 */
function getZoneBounds(zone: ScreenLayoutZone, board: ScreenSize): ScreenRect {
  const area = getScreenArea(board);

  // К свободному месту добавлен один промежуток, а из каждого места он
  // вычтен: так промежуток между местами одинаков, а у краёв его нет
  const width = area.width + DM_SCREEN_GAP;
  const height = area.height + DM_SCREEN_GAP;

  const x = area.x + Math.round(zone.left * width);
  const y = area.y + Math.round(zone.top * height);

  const right =
    area.x + Math.round((zone.left + zone.width) * width) - DM_SCREEN_GAP;

  const bottom =
    area.y + Math.round((zone.top + zone.height) * height) - DM_SCREEN_GAP;

  return { x, y, width: right - x, height: bottom - y };
}

/**
 * Прямоугольник места раскладки на холсте. Меньше наименьшего окна место
 * не становится.
 * @param zone - место в долях холста
 * @param board - размер холста
 */
export function getScreenZoneRect(
  zone: ScreenLayoutZone,
  board: ScreenSize,
): ScreenRect {
  const bounds = getZoneBounds(zone, board);

  return {
    ...bounds,
    width: Math.max(DM_SCREEN_WINDOW_MIN_SIZE.width, bounds.width),
    height: Math.max(DM_SCREEN_WINDOW_MIN_SIZE.height, bounds.height),
  };
}

/**
 * Помещается ли раскладка на холст: каждое её место не меньше наименьшего
 * окна. Иначе окна в соседних местах наезжали бы друг на друга.
 * @param layout - раскладка
 * @param board - размер холста
 */
export function isScreenLayoutFitting(
  layout: ScreenLayout,
  board: ScreenSize,
): boolean {
  return layout.zones.every((zone) => {
    const bounds = getZoneBounds(zone, board);

    return (
      bounds.width >= DM_SCREEN_WINDOW_MIN_SIZE.width
      && bounds.height >= DM_SCREEN_WINDOW_MIN_SIZE.height
    );
  });
}

/**
 * Указатель с окном в полосе у края холста, где показывается панель
 * раскладок. Полоса не ниже самой панели: до раскладок второй строки
 * указатель должен дотянуться, не спрятав панель.
 * @param pointer - где указатель на холсте
 * @param board - размер холста
 * @param placement - у какого края стоит панель
 * @param pickerHeight - высота панели, px; пока её не мерили — ноль
 */
export function isScreenPickerBand(
  pointer: ScreenPoint,
  board: ScreenSize,
  placement: ScreenPickerPlacement,
  pickerHeight: number,
): boolean {
  const band = Math.max(
    DM_SCREEN_PICKER_BAND,
    pickerHeight + DM_SCREEN_PICKER_OFFSET * 2,
  );

  if (placement === 'top') {
    return pointer.y < band;
  }

  if (placement === 'bottom') {
    return pointer.y > board.height - band;
  }

  return false;
}

/**
 * Половина холста, которую займёт окно, если его отпустить у бокового
 * края. Вдали от краёв — ничего.
 * @param pointer - где указатель на холсте
 * @param board - размер холста
 */
export function getScreenEdgeTarget(
  pointer: ScreenPoint,
  board: ScreenSize,
): ScreenLayoutTarget | undefined {
  if (pointer.x <= DM_SCREEN_EDGE_DISTANCE) {
    return { layout: DM_SCREEN_HALVES_LAYOUT, zoneIndex: 0 };
  }

  if (pointer.x >= board.width - DM_SCREEN_EDGE_DISTANCE) {
    return { layout: DM_SCREEN_HALVES_LAYOUT, zoneIndex: 1 };
  }

  return undefined;
}

/**
 * Проекция окна на ось, вдоль которой двигается граница.
 * @param tile - окно
 * @param isVertical - граница вертикальная и двигается по горизонтали
 */
function toAxisTile(tile: ScreenTile, isVertical: boolean): AxisTile {
  return isVertical
    ? {
        id: tile.id,
        start: tile.x,
        end: tile.x + tile.width,
        crossStart: tile.y,
        crossEnd: tile.y + tile.height,
      }
    : {
        id: tile.id,
        start: tile.y,
        end: tile.y + tile.height,
        crossStart: tile.x,
        crossEnd: tile.x + tile.width,
      };
}

/**
 * Окно с новым отрезком вдоль оси; поперёк оси оно не меняется.
 * @param tile - окно
 * @param isVertical - граница вертикальная
 * @param start - начало окна вдоль оси
 * @param end - конец окна вдоль оси
 */
function withAxisSpan(
  tile: ScreenTile,
  isVertical: boolean,
  start: number,
  end: number,
): ScreenTile {
  return isVertical
    ? { ...tile, x: start, width: end - start }
    : { ...tile, y: start, height: end - start };
}

/**
 * Пары соседей вдоль оси: между окнами ровно промежуток, и поперёк оси они
 * стоят друг против друга.
 * @param tiles - окна в проекции на ось
 */
function findAxisNeighbours(
  tiles: ReadonlyArray<AxisTile>,
): Array<AxisNeighbours> {
  return tiles.flatMap((before) =>
    tiles
      .filter(
        (after) =>
          after.id !== before.id
          && Math.abs(after.start - before.end - DM_SCREEN_GAP)
            <= DM_SCREEN_SPLITTER_TOLERANCE
          && after.crossStart < before.crossEnd
          && before.crossStart < after.crossEnd,
      )
      .map((after) => ({
        before,
        after,
        from: Math.max(before.crossStart, after.crossStart),
        to: Math.min(before.crossEnd, after.crossEnd),
      })),
  );
}

/**
 * Общие границы окон вдоль одной оси. Пары соседей на одной линии, идущие
 * друг за другом, сливаются в одну границу: в сетке 2×2 она проходит через
 * весь холст и двигает все четыре окна.
 * @param tiles - развёрнутые окна
 * @param isVertical - границы вертикальные
 */
function findAxisSplitters(
  tiles: ReadonlyArray<ScreenTile>,
  isVertical: boolean,
): Array<ScreenSplitter> {
  const neighbours = sortBy(
    findAxisNeighbours(tiles.map((tile) => toAxisTile(tile, isVertical))),
    [(pair) => pair.before.end, (pair) => pair.from],
  );

  return neighbours.reduce<Array<ScreenSplitter>>((splitters, pair) => {
    const previous = splitters.at(-1);

    const continuesPrevious =
      previous !== undefined
      && Math.abs(previous.position - pair.before.end)
        <= DM_SCREEN_SPLITTER_TOLERANCE
      && pair.from
        <= previous.to + DM_SCREEN_GAP + DM_SCREEN_SPLITTER_TOLERANCE;

    if (previous && continuesPrevious) {
      return [
        ...splitters.slice(0, -1),
        {
          ...previous,
          to: Math.max(previous.to, pair.to),
          beforeIds: uniq([...previous.beforeIds, pair.before.id]),
          afterIds: uniq([...previous.afterIds, pair.after.id]),
        },
      ];
    }

    return [
      ...splitters,
      {
        key: `${isVertical ? 'vertical' : 'horizontal'}:${pair.before.end}:${pair.from}`,
        isVertical,
        position: pair.before.end,
        from: pair.from,
        to: pair.to,
        beforeIds: [pair.before.id],
        afterIds: [pair.after.id],
      },
    ];
  }, []);
}

/**
 * Общие границы соседних окон: вертикальные и горизонтальные.
 * @param tiles - развёрнутые окна
 */
export function findScreenSplitters(
  tiles: ReadonlyArray<ScreenTile>,
): Array<ScreenSplitter> {
  return [
    ...findAxisSplitters(tiles, true),
    ...findAxisSplitters(tiles, false),
  ];
}

/**
 * Где указатель вдоль оси, по которой двигается граница: по горизонтали у
 * вертикальной и по вертикали у горизонтальной.
 * @param splitter - граница
 * @param pointer - где указатель
 */
export function getScreenSplitterPointer(
  splitter: ScreenSplitter,
  pointer: ScreenPoint,
): number {
  return splitter.isVertical ? pointer.x : pointer.y;
}

/**
 * Прямоугольник общей границы на холсте: промежуток между окнами.
 * @param splitter - граница
 * @param position - где граница сейчас; пока её тянут, она не на своём месте
 */
export function getScreenSplitterRect(
  splitter: ScreenSplitter,
  position: number = splitter.position,
): ScreenRect {
  const length = splitter.to - splitter.from;

  return splitter.isVertical
    ? { x: position, y: splitter.from, width: DM_SCREEN_GAP, height: length }
    : { x: splitter.from, y: position, width: length, height: DM_SCREEN_GAP };
}

/**
 * Сдвигает общую границу: окна перед ней меняют конец, окна за ней —
 * начало, промежуток между ними остаётся. Дальше, чем позволяет наименьший
 * размер окон по обе стороны, граница не идёт.
 * @param splitter - граница
 * @param delta - на сколько сдвинулся указатель
 * @param tiles - развёрнутые окна
 * @returns новое место границы и окна, которые изменились
 */
export function moveScreenSplitter(
  splitter: ScreenSplitter,
  delta: number,
  tiles: ReadonlyArray<ScreenTile>,
): { position: number; tiles: Array<ScreenTile> } {
  const { isVertical } = splitter;

  const minSize = isVertical
    ? DM_SCREEN_WINDOW_MIN_SIZE.width
    : DM_SCREEN_WINDOW_MIN_SIZE.height;

  const before = tiles.filter((tile) => splitter.beforeIds.includes(tile.id));
  const after = tiles.filter((tile) => splitter.afterIds.includes(tile.id));

  const lowest = Math.max(
    ...before.map((tile) => toAxisTile(tile, isVertical).start + minSize),
  );

  const highest =
    Math.min(...after.map((tile) => toAxisTile(tile, isVertical).end - minSize))
    - DM_SCREEN_GAP;

  // Окнам уже некуда сжиматься: граница остаётся на месте
  const position =
    lowest > highest
      ? splitter.position
      : clamp(Math.round(splitter.position + delta), lowest, highest);

  return {
    position,
    tiles: [
      ...before.map((tile) =>
        withAxisSpan(
          tile,
          isVertical,
          toAxisTile(tile, isVertical).start,
          position,
        ),
      ),
      ...after.map((tile) =>
        withAxisSpan(
          tile,
          isVertical,
          position + DM_SCREEN_GAP,
          toAxisTile(tile, isVertical).end,
        ),
      ),
    ],
  };
}

/**
 * Место и размер прямоугольника холста для привязки `style`.
 * @param rect - прямоугольник, px
 */
export function toScreenRectStyle(
  rect: ScreenRect,
): Record<'left' | 'top' | 'width' | 'height', string> {
  return {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}

/**
 * Место раскладки внутри её миниатюры для привязки `style`: в процентах.
 * @param zone - место в долях холста
 */
export function toScreenZoneStyle(
  zone: ScreenLayoutZone,
): Record<'left' | 'top' | 'width' | 'height', string> {
  return {
    left: `${zone.left * 100}%`,
    top: `${zone.top * 100}%`,
    width: `${zone.width * 100}%`,
    height: `${zone.height * 100}%`,
  };
}
