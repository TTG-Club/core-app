import { describe, expect, it } from 'vitest';

import {
  getImageFrameStyle,
  getWheelZoomFactor,
  IMAGE_FRAME_DEFAULT,
  IMAGE_FRAME_MAX_ZOOM,
  moveImageFrame,
  normalizeImageFrame,
  shiftImageFrame,
  toStoredImageFrame,
  zoomImageFrame,
} from '~ui/image-frame';

/** Квадратная рамка 200×200 и картинка 1600×900: по ширине запас есть. */
const WIDE_IMAGE_GEOMETRY = {
  frameWidth: 200,
  frameHeight: 200,
  naturalWidth: 1600,
  naturalHeight: 900,
};

describe('normalizeImageFrame', () => {
  it('пустой кадр — центр без приближения', () => {
    expect(normalizeImageFrame(null)).toEqual(IMAGE_FRAME_DEFAULT);
    expect(normalizeImageFrame(undefined)).toEqual(IMAGE_FRAME_DEFAULT);
  });

  it('прижимает значения вне пределов и заменяет нечисловые', () => {
    expect(normalizeImageFrame({ x: -1, y: 2, zoom: 10 })).toEqual({
      x: 0,
      y: 1,
      zoom: IMAGE_FRAME_MAX_ZOOM,
    });

    expect(
      normalizeImageFrame({ x: Number.NaN, y: Number.NaN, zoom: Number.NaN }),
    ).toEqual(IMAGE_FRAME_DEFAULT);
  });
});

describe('getImageFrameStyle', () => {
  it('без кадра стиля нет — картинка стоит по центру', () => {
    expect(getImageFrameStyle(null)).toBeUndefined();
  });

  it('точка фокуса — и положение, и центр масштаба', () => {
    expect(getImageFrameStyle({ x: 0.25, y: 0.75, zoom: 2 })).toEqual({
      objectPosition: '25% 75%',
      transformOrigin: '25% 75%',
      transform: 'scale(2)',
    });
  });

  it('без приближения масштаб не ставится', () => {
    expect(
      getImageFrameStyle({ x: 0.5, y: 0.5, zoom: 1 })?.transform,
    ).toBeUndefined();
  });
});

describe('moveImageFrame', () => {
  it('картинка едет за указателем: тянут вправо — фокус уходит влево', () => {
    // Картинка 1600×900 в рамке 200: ширина на экране ≈ 355,6, запас ≈ 155,6
    const moved = moveImageFrame(
      IMAGE_FRAME_DEFAULT,
      { x: 50, y: 0 },
      WIDE_IMAGE_GEOMETRY,
    );

    expect(moved.x).toBeCloseTo(0.5 - 50 / (1600 * (200 / 900) - 200));
  });

  it('по оси без запаса картинка не двигается', () => {
    const moved = moveImageFrame(
      IMAGE_FRAME_DEFAULT,
      { x: 0, y: 80 },
      WIDE_IMAGE_GEOMETRY,
    );

    expect(moved.y).toBe(0.5);
  });

  it('приближение открывает запас и по второй оси', () => {
    const moved = moveImageFrame(
      { x: 0.5, y: 0.5, zoom: 2 },
      { x: 0, y: 100 },
      WIDE_IMAGE_GEOMETRY,
    );

    expect(moved.y).toBe(0);
  });
});

describe('zoomImageFrame и shiftImageFrame', () => {
  it('приближение не выходит за пределы', () => {
    expect(zoomImageFrame(IMAGE_FRAME_DEFAULT, 0.3).zoom).toBe(1);

    expect(zoomImageFrame(IMAGE_FRAME_DEFAULT, 99).zoom).toBe(
      IMAGE_FRAME_MAX_ZOOM,
    );
  });

  it('сдвиг стрелками прижимается к краю', () => {
    expect(
      shiftImageFrame({ x: 0.99, y: 0.5, zoom: 1 }, { x: 0.05, y: 0 }).x,
    ).toBe(1);
  });
});

describe('toStoredImageFrame', () => {
  it('кадр без настройки не хранится', () => {
    expect(toStoredImageFrame({ ...IMAGE_FRAME_DEFAULT })).toBeNull();
  });

  it('значения округляются', () => {
    expect(toStoredImageFrame({ x: 0.123456, y: 0.5, zoom: 1.98765 })).toEqual({
      x: 0.1235,
      y: 0.5,
      zoom: 1.9877,
    });
  });
});

describe('getWheelZoomFactor', () => {
  it('прокрутка вверх приближает, вниз — отдаляет', () => {
    expect(getWheelZoomFactor({ deltaY: -100, deltaMode: 0 })).toBeGreaterThan(
      1,
    );

    expect(getWheelZoomFactor({ deltaY: 100, deltaMode: 0 })).toBeLessThan(1);
  });

  it('много мелких событий тачпада дают то же, что одно крупное', () => {
    const smallSteps = getWheelZoomFactor({ deltaY: -4, deltaMode: 0 }) ** 25;

    expect(smallSteps).toBeCloseTo(
      getWheelZoomFactor({ deltaY: -100, deltaMode: 0 }),
    );
  });

  it('прокрутка строками пересчитывается в пиксели', () => {
    expect(getWheelZoomFactor({ deltaY: -3, deltaMode: 1 })).toBeCloseTo(
      getWheelZoomFactor({ deltaY: -99, deltaMode: 0 }),
    );
  });
});
