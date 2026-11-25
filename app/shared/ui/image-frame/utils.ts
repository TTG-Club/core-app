import type { CSSProperties } from 'vue';

import type { ImageFrame } from '~/shared/types';

import { clamp } from 'es-toolkit';

import {
  IMAGE_FRAME_DEFAULT,
  IMAGE_FRAME_MAX_ZOOM,
  IMAGE_FRAME_MIN_ZOOM,
  IMAGE_FRAME_PRECISION,
  IMAGE_FRAME_WHEEL_DELTA_LINE,
  IMAGE_FRAME_WHEEL_LINE_HEIGHT,
  IMAGE_FRAME_WHEEL_ZOOM_SPEED,
} from './constants';

/** Размеры рамки и исходной картинки — из них считается сдвиг в долях. */
export interface ImageFrameGeometry {
  /** Ширина рамки на экране, px. */
  frameWidth: number;

  /** Высота рамки на экране, px. */
  frameHeight: number;

  /** Ширина исходной картинки, px. */
  naturalWidth: number;

  /** Высота исходной картинки, px. */
  naturalHeight: number;
}

/** Сдвиг указателя на экране, px. */
export interface ImageFrameOffset {
  x: number;
  y: number;
}

/**
 * Доля от 0 до 1; нечисловое значение заменяется запасным.
 *
 * @param value значение из кадра.
 * @param fallback значение по умолчанию для этой оси.
 */
function toRatio(value: number, fallback: number): number {
  return Number.isFinite(value) ? clamp(value, 0, 1) : fallback;
}

/**
 * Значение кадра, округлённое для хранения: точнее глаз не различит.
 *
 * @param value доля или приближение.
 */
function roundFrameValue(value: number): number {
  return Math.round(value * IMAGE_FRAME_PRECISION) / IMAGE_FRAME_PRECISION;
}

/**
 * Приближение в допустимых пределах; нечисловое значение — без приближения.
 *
 * @param value значение из кадра.
 */
function toZoom(value: number): number {
  return Number.isFinite(value)
    ? clamp(value, IMAGE_FRAME_MIN_ZOOM, IMAGE_FRAME_MAX_ZOOM)
    : IMAGE_FRAME_DEFAULT.zoom;
}

/**
 * Кадр с допустимыми значениями: пустой кадр — центр без приближения, числа
 * вне пределов прижимаются к краям. Кадр приходит с бэка — доверять ему
 * вслепую нельзя.
 *
 * @param frame сохранённый кадр.
 */
export function normalizeImageFrame(
  frame: ImageFrame | null | undefined,
): ImageFrame {
  if (!frame) {
    return { ...IMAGE_FRAME_DEFAULT };
  }

  return {
    x: toRatio(frame.x, IMAGE_FRAME_DEFAULT.x),
    y: toRatio(frame.y, IMAGE_FRAME_DEFAULT.y),
    zoom: toZoom(frame.zoom),
  };
}

/**
 * Совпадает ли кадр с видом без настройки: тогда хранить его незачем.
 *
 * @param frame кадр.
 */
export function isDefaultImageFrame(frame: ImageFrame): boolean {
  return (
    frame.x === IMAGE_FRAME_DEFAULT.x
    && frame.y === IMAGE_FRAME_DEFAULT.y
    && frame.zoom === IMAGE_FRAME_DEFAULT.zoom
  );
}

/**
 * Стиль картинки с `object-cover` внутри рамки с `overflow-hidden`. Точка
 * фокуса задаёт и `object-position`, и центр масштаба: при любом приближении
 * картинка не открывает пустых краёв, а пропорции рамки могут быть любыми —
 * квадрат на странице и прямоугольник карточки показывают один и тот же
 * участок.
 *
 * @param frame сохранённый кадр.
 * @returns стиль; undefined — кадр не настроен, картинка стоит по центру.
 */
export function getImageFrameStyle(
  frame: ImageFrame | null | undefined,
): CSSProperties | undefined {
  if (!frame) {
    return undefined;
  }

  const { x, y, zoom } = normalizeImageFrame(frame);
  const position = `${x * 100}% ${y * 100}%`;

  return {
    objectPosition: position,
    transformOrigin: position,
    transform: zoom === IMAGE_FRAME_MIN_ZOOM ? undefined : `scale(${zoom})`,
  };
}

/**
 * На сколько пикселей картинка выходит за рамку по каждой оси. Положение
 * точки фокуса `x` сдвигает левый край картинки на `-x * range`, поэтому
 * сдвиг указателя переводится в доли делением на этот запас.
 *
 * @param geometry размеры рамки и картинки.
 * @param zoom приближение.
 */
function getOverflow(
  geometry: ImageFrameGeometry,
  zoom: number,
): ImageFrameOffset {
  const { frameWidth, frameHeight, naturalWidth, naturalHeight } = geometry;

  // object-cover: картинка растягивается до большего из двух масштабов.
  const coverScale = Math.max(
    frameWidth / naturalWidth,
    frameHeight / naturalHeight,
  );

  return {
    x: naturalWidth * coverScale * zoom - frameWidth,
    y: naturalHeight * coverScale * zoom - frameHeight,
  };
}

/**
 * Доля после сдвига по одной оси. Нет запаса — картинка по этой оси целиком
 * в рамке, двигать некуда.
 *
 * @param ratio текущая доля.
 * @param offset сдвиг указателя, px.
 * @param overflow запас картинки за рамкой, px.
 */
function moveRatio(ratio: number, offset: number, overflow: number): number {
  if (overflow <= 0) {
    return ratio;
  }

  return clamp(ratio - offset / overflow, 0, 1);
}

/**
 * Кадр после перетаскивания: картинка едет за указателем.
 *
 * @param frame текущий кадр.
 * @param offset сдвиг указателя, px.
 * @param geometry размеры рамки и картинки.
 */
export function moveImageFrame(
  frame: ImageFrame,
  offset: ImageFrameOffset,
  geometry: ImageFrameGeometry,
): ImageFrame {
  const overflow = getOverflow(geometry, frame.zoom);

  return {
    ...frame,
    x: moveRatio(frame.x, offset.x, overflow.x),
    y: moveRatio(frame.y, offset.y, overflow.y),
  };
}

/**
 * Кадр для хранения: значения округлены, а кадр без сдвига и приближения
 * превращается в null — хранить его незачем.
 *
 * @param frame кадр из редактора.
 */
export function toStoredImageFrame(frame: ImageFrame): ImageFrame | null {
  const rounded: ImageFrame = {
    x: roundFrameValue(frame.x),
    y: roundFrameValue(frame.y),
    zoom: roundFrameValue(frame.zoom),
  };

  return isDefaultImageFrame(rounded) ? null : rounded;
}

/**
 * Кадр, сдвинутый на долю картинки — для стрелок клавиатуры.
 *
 * @param frame текущий кадр.
 * @param shift сдвиг в долях.
 */
export function shiftImageFrame(
  frame: ImageFrame,
  shift: ImageFrameOffset,
): ImageFrame {
  return normalizeImageFrame({
    ...frame,
    x: frame.x + shift.x,
    y: frame.y + shift.y,
  });
}

/**
 * Кадр с новым приближением в допустимых пределах.
 *
 * @param frame текущий кадр.
 * @param zoom новое приближение.
 */
export function zoomImageFrame(frame: ImageFrame, zoom: number): ImageFrame {
  return { ...frame, zoom: toZoom(zoom) };
}

/**
 * Во сколько раз изменить приближение по прокрутке колёсика: пропорционально
 * силе прокрутки, чтобы мышь и тачпад вели себя одинаково.
 *
 * @param event прокрутка колёсика.
 */
export function getWheelZoomFactor(
  event: Pick<WheelEvent, 'deltaY' | 'deltaMode'>,
): number {
  const pixels =
    event.deltaMode === IMAGE_FRAME_WHEEL_DELTA_LINE
      ? event.deltaY * IMAGE_FRAME_WHEEL_LINE_HEIGHT
      : event.deltaY;

  return Math.exp(-pixels * IMAGE_FRAME_WHEEL_ZOOM_SPEED);
}
