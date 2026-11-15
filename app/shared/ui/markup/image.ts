import type { MarkerAttributes } from './types';

/** Тип блочного маркера-картинки (`{@image | url:…}`). */
export const IMAGE_BLOCK_TYPE = 'image';

/** Сторона обтекания картинки текстом. */
export type ImageFloat = 'left' | 'right';

/**
 * Край, к которому прижата отдельно стоящая картинка. Середина — положение по
 * умолчанию, в атрибутах не хранится.
 */
export type ImageAlign = 'left' | 'right';

/**
 * Положение отдельно стоящей картинки по умолчанию — по центру. Значение для
 * классов оформления и кнопки выравнивания; в атрибутах узла его нет.
 */
export const IMAGE_DEFAULT_ALIGN = 'center';

/** Ширины картинки в процентах от ширины текста, которые предлагает редактор. */
export const IMAGE_WIDTH_PRESETS = [25, 33, 50, 75, 100] as const;

/** Наименьшая ширина картинки, %: уже неё картинку не разглядеть. */
const IMAGE_MIN_WIDTH = 10;

/** Наибольшая ширина картинки, % — вся ширина текста. */
const IMAGE_MAX_WIDTH = 100;

/**
 * Ширина колонки текста на широком экране, px. От неё считается размер картинки
 * в узкой колонке: там картинка держит тот же размер в пикселях, что и на
 * широком экране, а не долю ширины.
 */
const IMAGE_REFERENCE_COLUMN_WIDTH = 720;

/** Ширина по умолчанию у картинки, которую текст обтекает, %. */
const IMAGE_FLOAT_DEFAULT_WIDTH = 40;

/**
 * Символы, ломающие маркер: `|` делит атрибуты, фигурные скобки открывают и
 * закрывают маркер, перенос строки рвёт блок (описание делится по пустой
 * строке). Пробелы вокруг них схлопываются заодно, чтобы на месте вырезанного
 * не оставалось дыр.
 */
const IMAGE_TEXT_UNSAFE_REGEXP = /[|{}\s]+/g;

/** Адрес картинки: путь на сайте (`/s3/…`) либо ссылка `http(s)://…`. */
const IMAGE_URL_REGEXP = /^(?:\/(?!\/)|https?:\/\/)[^\s|{}]+$/i;

/** Настройки картинки в тексте: адрес, обтекание, ширина и подписи. */
export interface ImageAttributes {
  /** Адрес файла. */
  url: string;
  /** Сторона обтекания; не задана — картинка стоит отдельным блоком. */
  float?: ImageFloat;
  /**
   * Край, к которому прижата отдельно стоящая картинка; не задан — по центру.
   * У картинки с обтеканием сторону задаёт `float`, выравнивание не действует.
   */
  align?: ImageAlign;
  /** Ширина в процентах; не задана — берётся ширина по умолчанию. */
  width?: number;
  /** Текст-описание для тех, кто не видит картинку. */
  alt?: string;
  /** Подпись под картинкой. */
  caption?: string;
}

/**
 * Проверяет адрес картинки. Отсекает `javascript:` и прочие схемы, а заодно
 * символы, которые развалили бы маркер при сохранении.
 *
 * @param url - Адрес из атрибута `url`
 * @returns true, если адрес можно подставлять в `src`
 */
export function isImageUrl(url: string): boolean {
  return IMAGE_URL_REGEXP.test(url);
}

/**
 * Убирает из подписи символы, ломающие маркер при разборе.
 *
 * @param imageText - Подпись или текст-описание, введённые автором
 * @returns Текст, безопасный внутри маркера
 */
export function sanitizeImageText(imageText: string): string {
  return imageText.replace(IMAGE_TEXT_UNSAFE_REGEXP, ' ').trim();
}

/**
 * Приводит ширину картинки к целым процентам в допустимых пределах.
 *
 * @param rawWidth - Сырое значение атрибута `width`
 * @returns Ширина в процентах; undefined — значение не число
 */
function toImageWidth(rawWidth: unknown): number | undefined {
  if (rawWidth === null || rawWidth === undefined || rawWidth === '') {
    return undefined;
  }

  const width = Number(rawWidth);

  if (!Number.isFinite(width)) {
    return undefined;
  }

  return Math.round(
    Math.min(IMAGE_MAX_WIDTH, Math.max(IMAGE_MIN_WIDTH, width)),
  );
}

/**
 * Приводит сторону обтекания к известному значению.
 *
 * @param rawFloat - Сырое значение атрибута `float`
 * @returns Сторона обтекания; undefined — обтекания нет
 */
function toImageFloat(rawFloat: unknown): ImageFloat | undefined {
  if (rawFloat === 'left' || rawFloat === 'right') {
    return rawFloat;
  }

  return undefined;
}

/**
 * Приводит выравнивание к известному значению.
 *
 * @param rawAlign - Сырое значение атрибута `align`
 * @returns Край картинки; undefined — по центру
 */
function toImageAlign(rawAlign: unknown): ImageAlign | undefined {
  if (rawAlign === 'left' || rawAlign === 'right') {
    return rawAlign;
  }

  return undefined;
}

/**
 * Приводит подпись к строке. Разбор атрибутов превращает «123» в число, а
 * «true» в логическое значение, поэтому тип здесь не гарантирован.
 *
 * @param rawText - Сырое значение атрибута
 * @returns Очищенный текст; undefined — текста нет
 */
function toImageText(rawText: unknown): string | undefined {
  if (rawText === null || rawText === undefined) {
    return undefined;
  }

  return sanitizeImageText(String(rawText)) || undefined;
}

/**
 * Читает настройки картинки из атрибутов узла — разобранного маркера, узла с
 * бэкенда или узла редактора. Кривые значения отбрасываются, а не роняют
 * страницу.
 *
 * @param attrs - Атрибуты узла
 * @returns Настройки картинки; undefined — адреса нет или он небезопасен
 */
export function readImageAttributes(
  attrs: Record<string, unknown> | undefined,
): ImageAttributes | undefined {
  const url = typeof attrs?.url === 'string' ? attrs.url.trim() : '';

  if (!isImageUrl(url)) {
    return undefined;
  }

  return {
    url,
    float: toImageFloat(attrs?.float),
    align: toImageAlign(attrs?.align),
    width: toImageWidth(attrs?.width),
    alt: toImageText(attrs?.alt),
    caption: toImageText(attrs?.caption),
  };
}

/**
 * Ширина, с которой картинка рисуется: заданная автором либо по умолчанию —
 * обтекаемая занимает часть строки, отдельно стоящая — всю ширину текста.
 *
 * @param image - Настройки картинки
 * @returns Ширина в процентах
 */
export function getImageWidth(image: ImageAttributes): number {
  if (image.width !== undefined) {
    return image.width;
  }

  return image.float ? IMAGE_FLOAT_DEFAULT_WIDTH : IMAGE_MAX_WIDTH;
}

/**
 * Ширина картинки в узкой колонке (телефон, дровер) — значение CSS. Доля от
 * ширины там не годится: четверть экрана телефона — картинка с марку, а вся
 * ширина раздувает маленькую картинку в несколько раз. Поэтому картинка держит
 * размер, который у неё был бы в широкой колонке, и сжимается, только когда
 * не помещается.
 *
 * @param image - Настройки картинки
 * @returns Значение `width`: не шире колонки и не шире размера на широком экране
 */
export function getImageNarrowWidth(image: ImageAttributes): string {
  const wideColumnPixels = Math.round(
    (getImageWidth(image) / IMAGE_MAX_WIDTH) * IMAGE_REFERENCE_COLUMN_WIDTH,
  );

  return `min(100%, ${wideColumnPixels}px)`;
}

/**
 * Собирает атрибуты узла хранения из настроек картинки: пустые значения в узел
 * не попадают.
 *
 * @param image - Настройки картинки
 * @returns Атрибуты узла `image`
 */
export function toImageMarkerAttributes(
  image: ImageAttributes,
): MarkerAttributes {
  const attrs: MarkerAttributes = { url: image.url };

  if (image.float) {
    attrs.float = image.float;
  }

  if (image.align) {
    attrs.align = image.align;
  }

  if (image.width !== undefined) {
    attrs.width = image.width;
  }

  if (image.alt) {
    attrs.alt = image.alt;
  }

  if (image.caption) {
    attrs.caption = image.caption;
  }

  return attrs;
}

/**
 * Собирает маркер картинки `{@image | url:… | float:… | align:… | width:… }` — строку,
 * которой картинка живёт в исходнике редактора.
 *
 * @param image - Настройки картинки
 * @returns Строка маркера
 */
export function buildImageMarker(image: ImageAttributes): string {
  const attributeParts = Object.entries(toImageMarkerAttributes(image)).map(
    ([attributeName, attributeValue]) =>
      `${attributeName}:${String(attributeValue)}`,
  );

  return `{@${IMAGE_BLOCK_TYPE} | ${attributeParts.join(' | ')}}`;
}
