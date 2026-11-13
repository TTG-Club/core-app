import type { ScreenTile, ScreenWindow } from '~dm-screen/model';

import { describe, expect, it } from 'vitest';

import {
  appendScreenWindow,
  arrangeScreenWindows,
  DM_SCREEN_GAP,
  DM_SCREEN_HALVES_LAYOUT,
  DM_SCREEN_LAYOUTS,
  DM_SCREEN_MARGIN,
  DM_SCREEN_WINDOW_MIN_SIZE,
  DM_SCREEN_WINDOW_SIZE,
  findScreenSplitters,
  fitScreenWindowSize,
  getScreenEdgeTarget,
  getScreenSplitterPointer,
  getScreenZoneRect,
  isScreenLayoutFitting,
  isScreenPickerBand,
  keepScreenWindowReachable,
  magnetScreenWindow,
  moveScreenSplitter,
  placeScreenWindow,
  resizeScreenWindow,
} from '~dm-screen/model';

const BOARD = { width: 1600, height: 900 };

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
    expect(fitScreenWindowSize({ width: 400, height: 100 })).toEqual({
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

describe('keepScreenWindowReachable', () => {
  const size = { width: 480, height: 600 };

  it('шапка окна не уходит выше холста и ниже его края', () => {
    expect(keepScreenWindowReachable({ x: 100, y: -50 }, size, BOARD).y).toBe(
      0,
    );

    expect(
      keepScreenWindowReachable({ x: 100, y: 5000 }, size, BOARD).y,
    ).toBeLessThan(BOARD.height);
  });

  it('сбоку от окна остаётся видимая часть', () => {
    const left = keepScreenWindowReachable({ x: -5000, y: 0 }, size, BOARD);
    const right = keepScreenWindowReachable({ x: 5000, y: 0 }, size, BOARD);

    expect(left.x + size.width).toBeGreaterThan(0);
    expect(right.x).toBeLessThan(BOARD.width);
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

  it('верхняя сторона не уходит выше холста', () => {
    const resized = resizeScreenWindow(
      start,
      { horizontal: 0, vertical: -1 },
      { x: 0, y: -5000 },
      BOARD,
    );

    expect(resized.y).toBe(0);
    expect(resized.y + resized.height).toBe(start.y + start.height);
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
      isScreenLayoutFitting(sixColumns, { width: 1856, height: 900 }),
    ).toBe(true);
  });

  it('три ряда не встают на низкий холст', () => {
    if (!sixByThree) {
      throw new Error('В раскладках должна быть сетка 6×3');
    }

    expect(
      isScreenLayoutFitting(sixByThree, { width: 1856, height: 900 }),
    ).toBe(true);

    expect(
      isScreenLayoutFitting(sixByThree, { width: 1856, height: 400 }),
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
  const gridBoard = { width: 1200, height: 1200 };

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
