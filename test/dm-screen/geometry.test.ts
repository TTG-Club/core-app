import type { ScreenTile, ScreenWindow } from '~dm-screen/model';

import { describe, expect, it } from 'vitest';

import {
  appendScreenWindow,
  arrangeScreenWindows,
  centerScreenView,
  clampScreenView,
  DM_SCREEN_FIELD,
  DM_SCREEN_GAP,
  DM_SCREEN_HALVES_LAYOUT,
  DM_SCREEN_LAYOUTS,
  DM_SCREEN_MARGIN,
  DM_SCREEN_WINDOW_MIN_SIZE,
  DM_SCREEN_WINDOW_SIZE,
  DM_SCREEN_ZOOM,
  findScreenSplitters,
  fitScreenView,
  fitScreenWindowSize,
  getScreenBounds,
  getScreenEdgeTarget,
  getScreenSplitterPointer,
  getScreenVisibleRect,
  getScreenZoneRect,
  isScreenLayoutFitting,
  isScreenPickerBand,
  isScreenRectVisible,
  keepScreenWindowOnField,
  magnetScreenWindow,
  moveScreenSplitter,
  placeScreenWindow,
  resizeScreenWindow,
  toScreenCanvasRect,
  toScreenFieldPoint,
  zoomScreenView,
} from '~dm-screen/model';

const BOARD = { x: 0, y: 0, width: 1600, height: 900 };

/**
 * Окно ширмы для тестов.
 * @param overrides - поля, отличные от обычных
 */
function createWindow(overrides: Partial<ScreenWindow> = {}): ScreenWindow {
  return {
    id: 'window',
    path: '/spells/fireball',
    title: 'Огненный шар',
    x: 100,
    y: 100,
    width: 480,
    height: 600,
    layer: 1,
    isMinimized: false,
    ...overrides,
  };
}

describe('fitScreenWindowSize', () => {
  it('на просторном холсте окно обычного размера', () => {
    expect(fitScreenWindowSize(BOARD)).toEqual(DM_SCREEN_WINDOW_SIZE);
  });

  it('на тесном холсте окно ужимается, но не меньше наименьшего', () => {
    expect(
      fitScreenWindowSize({ x: 0, y: 0, width: 400, height: 100 }),
    ).toEqual({
      width: 400 - DM_SCREEN_MARGIN * 2,
      height: DM_SCREEN_WINDOW_MIN_SIZE.height,
    });
  });
});

describe('placeScreenWindow', () => {
  const size = { width: 480, height: 600 };

  it('без точки клика первое окно встаёт по центру холста', () => {
    expect(placeScreenWindow(BOARD, size, undefined, 0)).toEqual({
      x: 560,
      y: 150,
    });
  });

  it('следующие окна идут лесенкой', () => {
    const first = placeScreenWindow(BOARD, size, undefined, 0);
    const second = placeScreenWindow(BOARD, size, undefined, 1);

    expect(second.x).toBeGreaterThan(first.x);
    expect(second.y).toBeGreaterThan(first.y);
  });

  it('окно у точки клика не выходит за край холста', () => {
    expect(placeScreenWindow(BOARD, size, { x: 1590, y: 890 }, 0)).toEqual({
      x: BOARD.width - DM_SCREEN_MARGIN - size.width,
      y: BOARD.height - DM_SCREEN_MARGIN - size.height,
    });
  });
});

describe('appendScreenWindow', () => {
  it('новая запись встаёт окном поверх остальных', () => {
    const existing = createWindow({ layer: 4 });

    const result = appendScreenWindow(
      [existing],
      { path: '/bestiary/goblin', title: 'Гоблин' },
      BOARD,
      'next',
    );

    expect(result.isAdded).toBe(true);
    expect(result.windowId).toBe('next');
    expect(result.windows).toHaveLength(2);
    expect(result.windows[1]).toMatchObject({ id: 'next', layer: 5 });
  });

  it('запись, которая уже на ширме, не дублируется, а разворачивается', () => {
    const existing = createWindow({ isMinimized: true, layer: 2 });
    const other = createWindow({ id: 'other', path: '/feats/alert', layer: 7 });

    const result = appendScreenWindow(
      [existing, other],
      { path: existing.path, title: existing.title },
      BOARD,
      'next',
    );

    expect(result.isAdded).toBe(false);
    expect(result.windowId).toBe(existing.id);
    expect(result.windows).toHaveLength(2);
    expect(result.windows[0]).toMatchObject({ isMinimized: false, layer: 8 });
  });
});

describe('arrangeScreenWindows', () => {
  it('без окон раскладывать нечего', () => {
    expect(arrangeScreenWindows([], BOARD)).toEqual([]);
  });

  it('одно окно занимает всё свободное место', () => {
    expect(arrangeScreenWindows(['a'], BOARD)).toEqual([
      {
        id: 'a',
        x: DM_SCREEN_MARGIN,
        y: DM_SCREEN_MARGIN,
        width: BOARD.width - DM_SCREEN_MARGIN * 2,
        height: BOARD.height - DM_SCREEN_MARGIN * 2,
      },
    ]);
  });

  it('между окнами обычный промежуток, сетка доходит до краёв холста', () => {
    const tiles = arrangeScreenWindows(['a', 'b', 'c', 'd', 'e', 'f'], BOARD);
    const [first, second] = tiles;
    const last = tiles.at(-1);

    expect(second && first && second.x - (first.x + first.width)).toBe(
      DM_SCREEN_GAP,
    );

    expect(last && last.x + last.width).toBe(BOARD.width - DM_SCREEN_MARGIN);
    expect(last && last.y + last.height).toBe(BOARD.height - DM_SCREEN_MARGIN);
  });

  it('клетки не становятся меньше наименьшего окна', () => {
    const ids = Array.from({ length: 60 }, (_, index) => `window-${index}`);

    const isRoomy = arrangeScreenWindows(ids, BOARD).every(
      (tile) =>
        tile.width >= DM_SCREEN_WINDOW_MIN_SIZE.width
        && tile.height >= DM_SCREEN_WINDOW_MIN_SIZE.height,
    );

    expect(isRoomy).toBe(true);
  });
});

describe('magnetScreenWindow', () => {
  const size = { width: 300, height: 200 };

  it('окно притягивается к краю свободного места', () => {
    expect(magnetScreenWindow({ x: 14, y: 3, ...size }, [], BOARD)).toEqual({
      x: DM_SCREEN_MARGIN,
      y: DM_SCREEN_MARGIN,
    });
  });

  it('окно встаёт рядом с соседом через промежуток', () => {
    const neighbour = { x: 100, y: 100, width: 400, height: 300 };

    expect(
      magnetScreenWindow({ x: 518, y: 96, ...size }, [neighbour], BOARD),
    ).toEqual({ x: 500 + DM_SCREEN_GAP, y: 100 });
  });

  it('вдали от краёв окно остаётся, где его держат', () => {
    expect(magnetScreenWindow({ x: 700, y: 400, ...size }, [], BOARD)).toEqual({
      x: 700,
      y: 400,
    });
  });
});

describe('resizeScreenWindow', () => {
  const start = { x: 400, y: 300, width: 480, height: 400 };

  it('правую сторону тянут — левая остаётся на месте', () => {
    expect(
      resizeScreenWindow(
        start,
        { horizontal: 1, vertical: 0 },
        { x: 100, y: 50 },
        BOARD,
      ),
    ).toEqual({ ...start, width: 580 });
  });

  it('левую сторону тянут — правая остаётся на месте', () => {
    const resized = resizeScreenWindow(
      start,
      { horizontal: -1, vertical: 0 },
      { x: -100, y: 0 },
      BOARD,
    );

    expect(resized).toEqual({ ...start, x: 300, width: 580 });
  });

  it('окно не сжимается меньше наименьшего', () => {
    const resized = resizeScreenWindow(
      start,
      { horizontal: -1, vertical: 1 },
      { x: 5000, y: -5000 },
      BOARD,
    );

    expect(resized.width).toBe(DM_SCREEN_WINDOW_MIN_SIZE.width);
    expect(resized.height).toBe(DM_SCREEN_WINDOW_MIN_SIZE.height);
    expect(resized.x + resized.width).toBe(start.x + start.width);
    expect(resized.y).toBe(start.y);
  });

  it('сторона притягивается к краю соседа через промежуток', () => {
    const neighbour = { x: 1000, y: 300, width: 300, height: 400 };

    const resized = resizeScreenWindow(
      start,
      { horizontal: 1, vertical: 0 },
      { x: 112, y: 0 },
      BOARD,
      [neighbour],
    );

    expect(resized.x + resized.width).toBe(neighbour.x - DM_SCREEN_GAP);
  });
});

describe('getScreenZoneRect', () => {
  it('половины холста стоят через промежуток и доходят до краёв', () => {
    const [leftZone, rightZone] = DM_SCREEN_HALVES_LAYOUT.zones;

    if (!leftZone || !rightZone) {
      throw new Error('В раскладке из половин должно быть два места');
    }

    const left = getScreenZoneRect(leftZone, BOARD);
    const right = getScreenZoneRect(rightZone, BOARD);

    expect(left.x).toBe(DM_SCREEN_MARGIN);
    expect(right.x - (left.x + left.width)).toBe(DM_SCREEN_GAP);
    expect(right.x + right.width).toBe(BOARD.width - DM_SCREEN_MARGIN);
    expect(left.height).toBe(BOARD.height - DM_SCREEN_MARGIN * 2);
  });
});

describe('isScreenLayoutFitting', () => {
  const sixColumns = DM_SCREEN_LAYOUTS.find(
    (layout) => layout.key === 'columns-6',
  );

  const sixByThree = DM_SCREEN_LAYOUTS.find(
    (layout) => layout.key === 'grid-6x3',
  );

  it('шесть колонок встают только на широкий холст', () => {
    if (!sixColumns) {
      throw new Error('В раскладках должны быть шесть колонок');
    }

    expect(isScreenLayoutFitting(sixColumns, BOARD)).toBe(false);

    expect(
      isScreenLayoutFitting(sixColumns, {
        x: 0,
        y: 0,
        width: 1856,
        height: 900,
      }),
    ).toBe(true);
  });

  it('три ряда не встают на низкий холст', () => {
    if (!sixByThree) {
      throw new Error('В раскладках должна быть сетка 6×3');
    }

    expect(
      isScreenLayoutFitting(sixByThree, {
        x: 0,
        y: 0,
        width: 1856,
        height: 900,
      }),
    ).toBe(true);

    expect(
      isScreenLayoutFitting(sixByThree, {
        x: 0,
        y: 0,
        width: 1856,
        height: 400,
      }),
    ).toBe(false);
  });

  it('половины холста помещаются на обычный экран', () => {
    expect(isScreenLayoutFitting(DM_SCREEN_HALVES_LAYOUT, BOARD)).toBe(true);
  });
});

describe('isScreenPickerBand', () => {
  it('панель сверху видна, пока указатель у верха холста', () => {
    expect(isScreenPickerBand({ x: 800, y: 40 }, BOARD, 'top', 0)).toBe(true);
    expect(isScreenPickerBand({ x: 800, y: 400 }, BOARD, 'top', 0)).toBe(false);
    expect(isScreenPickerBand({ x: 800, y: 880 }, BOARD, 'top', 0)).toBe(false);
  });

  it('панель снизу видна, пока указатель у низа холста', () => {
    expect(isScreenPickerBand({ x: 800, y: 880 }, BOARD, 'bottom', 0)).toBe(
      true,
    );

    expect(isScreenPickerBand({ x: 800, y: 40 }, BOARD, 'bottom', 0)).toBe(
      false,
    );
  });

  it('скрытая панель не видна нигде', () => {
    expect(isScreenPickerBand({ x: 800, y: 40 }, BOARD, 'hidden', 0)).toBe(
      false,
    );

    expect(isScreenPickerBand({ x: 800, y: 880 }, BOARD, 'hidden', 0)).toBe(
      false,
    );
  });

  it('полоса растёт вместе с высокой панелью', () => {
    expect(isScreenPickerBand({ x: 800, y: 200 }, BOARD, 'top', 0)).toBe(false);

    expect(isScreenPickerBand({ x: 800, y: 200 }, BOARD, 'top', 220)).toBe(
      true,
    );
  });
});

describe('раскладка «одно сверху, два снизу»', () => {
  const layout = DM_SCREEN_LAYOUTS.find(
    (candidate) => candidate.key === 'main-top',
  );

  it('верхнее окно во всю ширину, нижние делят её пополам', () => {
    const [topZone, leftZone, rightZone] = layout?.zones ?? [];

    if (!topZone || !leftZone || !rightZone) {
      throw new Error('В раскладке должно быть три места');
    }

    const top = getScreenZoneRect(topZone, BOARD);
    const left = getScreenZoneRect(leftZone, BOARD);
    const right = getScreenZoneRect(rightZone, BOARD);

    expect(top.width).toBe(BOARD.width - DM_SCREEN_MARGIN * 2);
    expect(left.y - (top.y + top.height)).toBe(DM_SCREEN_GAP);
    expect(right.x - (left.x + left.width)).toBe(DM_SCREEN_GAP);
    expect(right.x + right.width).toBe(BOARD.width - DM_SCREEN_MARGIN);
    expect(left.y + left.height).toBe(BOARD.height - DM_SCREEN_MARGIN);
  });
});

describe('getScreenEdgeTarget', () => {
  it('у левого края окно займёт левую половину, у правого — правую', () => {
    expect(getScreenEdgeTarget({ x: 5, y: 400 }, BOARD)?.zoneIndex).toBe(0);
    expect(getScreenEdgeTarget({ x: 1595, y: 400 }, BOARD)?.zoneIndex).toBe(1);
  });

  it('вдали от краёв места нет', () => {
    expect(getScreenEdgeTarget({ x: 800, y: 400 }, BOARD)).toBeUndefined();
  });
});

describe('общие границы окон', () => {
  // На квадратном холсте четыре окна встают сеткой 2×2
  const gridBoard = { x: 0, y: 0, width: 1200, height: 1200 };

  const grid: Array<ScreenTile> = arrangeScreenWindows(
    ['a', 'b', 'c', 'd'],
    gridBoard,
  );

  it('в сетке 2×2 одна вертикальная и одна горизонтальная граница', () => {
    const splitters = findScreenSplitters(grid);

    const vertical = splitters.filter((splitter) => splitter.isVertical);
    const horizontal = splitters.filter((splitter) => !splitter.isVertical);

    expect(vertical).toHaveLength(1);
    expect(horizontal).toHaveLength(1);
    expect(vertical[0]?.beforeIds).toEqual(['a', 'c']);
    expect(vertical[0]?.afterIds).toEqual(['b', 'd']);
  });

  it('указатель границы берётся вдоль оси её движения', () => {
    const [vertical] = findScreenSplitters(grid).filter(
      (splitter) => splitter.isVertical,
    );

    const [horizontal] = findScreenSplitters(grid).filter(
      (splitter) => !splitter.isVertical,
    );

    if (!vertical || !horizontal) {
      throw new Error('У сетки должны быть обе общие границы');
    }

    expect(getScreenSplitterPointer(vertical, { x: 10, y: 20 })).toBe(10);
    expect(getScreenSplitterPointer(horizontal, { x: 10, y: 20 })).toBe(20);
  });

  it('окна, стоящие врозь, границы не делят', () => {
    expect(
      findScreenSplitters([
        { id: 'a', x: 10, y: 10, width: 300, height: 300 },
        { id: 'b', x: 500, y: 10, width: 300, height: 300 },
      ]),
    ).toEqual([]);
  });

  it('сдвиг границы меняет окна по обе стороны, промежуток остаётся', () => {
    const [splitter] = findScreenSplitters(grid);

    if (!splitter) {
      throw new Error('У сетки должна быть общая граница');
    }

    const moved = moveScreenSplitter(splitter, 100, grid);
    const before = moved.tiles.find((tile) => tile.id === 'a');
    const after = moved.tiles.find((tile) => tile.id === 'b');

    expect(moved.position).toBe(splitter.position + 100);
    expect(moved.tiles).toHaveLength(4);
    expect(before && before.x + before.width).toBe(moved.position);
    expect(after?.x).toBe(moved.position + DM_SCREEN_GAP);

    expect(after && after.x + after.width).toBe(
      gridBoard.width - DM_SCREEN_MARGIN,
    );
  });

  it('граница не сжимает окна меньше наименьшего', () => {
    const [splitter] = findScreenSplitters(grid);

    if (!splitter) {
      throw new Error('У сетки должна быть общая граница');
    }

    const moved = moveScreenSplitter(splitter, -5000, grid);
    const before = moved.tiles.find((tile) => tile.id === 'a');

    expect(before?.width).toBe(DM_SCREEN_WINDOW_MIN_SIZE.width);
  });
});

describe('обзор поля', () => {
  const canvas = { width: 1600, height: 900 };

  it('отдалённое поле показывает больше, а окна встают в видимой части', () => {
    const board = getScreenVisibleRect(
      { x: 2000, y: -1000, zoom: 0.5 },
      canvas,
    );

    expect(board).toEqual({ x: 2000, y: -1000, width: 3200, height: 1800 });

    const position = placeScreenWindow(
      board,
      DM_SCREEN_WINDOW_SIZE,
      undefined,
      0,
    );

    expect(position.x).toBeGreaterThan(board.x);
    expect(position.x).toBeLessThan(board.x + board.width);
    expect(position.y).toBeGreaterThan(board.y);
    expect(position.y).toBeLessThan(board.y + board.height);
  });

  it('точка холста и прямоугольник поля переводятся туда и обратно', () => {
    const view = { x: 100, y: 200, zoom: 0.5 };

    expect(toScreenFieldPoint({ x: 50, y: 50 }, view)).toEqual({
      x: 200,
      y: 300,
    });

    expect(
      toScreenCanvasRect({ x: 200, y: 300, width: 400, height: 200 }, view),
    ).toEqual({ x: 50, y: 50, width: 200, height: 100 });
  });

  it('масштаб меняется вокруг якоря и не выходит за пределы', () => {
    const view = { x: 0, y: 0, zoom: 1 };
    const anchor = { x: 400, y: 300 };
    const zoomed = zoomScreenView(view, 0.5, anchor);

    expect(toScreenFieldPoint(anchor, zoomed)).toEqual(
      toScreenFieldPoint(anchor, view),
    );

    expect(zoomScreenView(view, 5, anchor).zoom).toBe(DM_SCREEN_ZOOM.max);
    expect(zoomScreenView(view, 0.01, anchor).zoom).toBe(DM_SCREEN_ZOOM.min);
  });

  it('обзор подгоняется под все окна и ставит их по центру', () => {
    const bounds = getScreenBounds([
      { x: -1000, y: 0, width: 500, height: 500 },
      { x: 3000, y: 1500, width: 500, height: 500 },
    ]);

    expect(bounds).toEqual({ x: -1000, y: 0, width: 4500, height: 2000 });

    if (!bounds) {
      throw new Error('У двух окон должны быть общие границы');
    }

    const view = fitScreenView(bounds, canvas, 0);
    const board = getScreenVisibleRect(view, canvas);

    expect(view.zoom).toBeLessThan(1);
    expect(board.x).toBeLessThanOrEqual(bounds.x);

    expect(board.x + board.width).toBeGreaterThanOrEqual(
      bounds.x + bounds.width,
    );

    expect(getScreenBounds([])).toBeUndefined();
  });

  it('одно окно не приближается сверх обычного масштаба', () => {
    expect(
      fitScreenView({ x: 0, y: 0, width: 100, height: 100 }, canvas, 0).zoom,
    ).toBe(DM_SCREEN_ZOOM.max);
  });

  it('обзор не уходит за края поля', () => {
    const far = clampScreenView({ x: 1e6, y: -1e6, zoom: 1 }, canvas);

    expect(far.x + canvas.width).toBe(
      DM_SCREEN_FIELD.x + DM_SCREEN_FIELD.width,
    );

    expect(far.y).toBe(DM_SCREEN_FIELD.y);

    const centered = centerScreenView(
      { x: 0, y: 0, zoom: 1 },
      { x: 800, y: 450 },
      canvas,
    );

    expect(clampScreenView(centered, canvas)).toEqual(centered);
  });

  it('окно не уходит за край поля', () => {
    const kept = keepScreenWindowOnField({
      x: 1e6,
      y: -1e6,
      width: 480,
      height: 600,
    });

    expect(kept.x + kept.width).toBe(DM_SCREEN_FIELD.x + DM_SCREEN_FIELD.width);
    expect(kept.y).toBe(DM_SCREEN_FIELD.y);
  });

  it('окно за краем холста не считается видимым', () => {
    const board = { x: 0, y: 0, ...canvas };

    expect(
      isScreenRectVisible({ x: 1500, y: 800, width: 480, height: 600 }, board),
    ).toBe(true);

    expect(
      isScreenRectVisible({ x: 1700, y: 0, width: 480, height: 600 }, board),
    ).toBe(false);
  });
});
