/**
 * Возможные варианты ширины макета сайта.
 */
export type LayoutWidth = 'default' | 'wide';

/**
 * Перечисление для ширины макета сайта.
 */
export enum LayoutWidthName {
  Default = 'default',
  Wide = 'wide',
}

/**
 * Ширина списка в сплит-панели раздела, в процентах от общей ширины списка и
 * карточки.
 */
export const SECTION_SPLIT_LIST_SIZE = {
  /** Обычный раздел: список и карточка поровну. */
  default: 50,
  /**
   * Раздел с широкой карточкой (класс): на большом экране карточка сразу
   * встаёт в две колонки — свойства с навигацией слева, текст справа.
   */
  wideDetail: 35,
  min: 30,
  max: 70,
} as const;

/** Ключ куки, в которой хранится ширина списка сплит-панели раздела. */
export const SECTION_SPLIT_STORAGE_KEY = 'ttg-section-split';

/**
 * Свой ключ для разделов с широкой карточкой: иначе ширина, сохранённая
 * в обычном разделе, перебивает их ширину по умолчанию.
 */
export const SECTION_SPLIT_WIDE_DETAIL_STORAGE_KEY = 'ttg-section-split-wide';
