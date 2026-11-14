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
 * Кука с ширинами колонок широкого режима, в процентах: по ширине на каждую
 * раскладку списка (`SECTION_SPLIT_ID`, `SECTION_COMPACT_SPLIT_ID`, они же с
 * приставкой узкой раскладки) и на колонку фильтров
 * (`SECTION_FILTERS_SPLIT_ID`).
 */
export const SECTION_SPLIT_STORAGE_KEY = 'ttg-section-split-sizes';

/** Раскладка обычного списка. */
export const SECTION_SPLIT_ID = 'list';

/** Ширина списка в широком режиме по умолчанию, в процентах. */
export const SECTION_LIST_SIZE = {
  default: 50,
  min: 30,
  max: 70,
} as const;

/**
 * Узкий список для разделов из десятка записей с картинками (классы, виды):
 * запись получает почти всю ширину и раскладывается в две колонки.
 */
export const SECTION_COMPACT_LIST_SIZE = {
  default: 22,
  min: 15,
  max: 45,
} as const;

/** Своя ширина узкого списка — не сбивает ширины остальным разделам. */
export const SECTION_COMPACT_SPLIT_ID = 'compact-list';

/** Под этим ключом в куке ширин запоминается колонка фильтров. */
export const SECTION_FILTERS_SPLIT_ID = 'filters';

/**
 * Ширина колонки фильтров в широком режиме, в процентах окна. По умолчанию —
 * около прежних 300 px на экране 1440 px.
 */
export const SECTION_FILTERS_SIZE = {
  default: 21,
  min: 15,
  max: 35,
} as const;

/** Линия между колонками широкого режима: светлеет при наведении, при перетаскивании — цвет акцента. */
export const SECTION_SPLIT_HANDLE_CLASS =
  'w-px border-l border-default transition-colors data-[state=drag]:border-primary data-[state=hover]:border-accented';

/** Разница ширин в процентах, меньше которой разделитель не считается сдвинутым. */
export const SPLIT_SIZE_EPSILON = 0.1;

/**
 * Ширина списка в узкой раскладке (как на старом сайте 5e14: список — треть
 * колонки, запись — остальное), в процентах.
 */
export const SECTION_CENTERED_LIST_SIZE = {
  default: 36,
  min: 25,
  max: 60,
} as const;

/** Приставка к раскладке, под которой узкая раскладка запоминает свою ширину списка. */
export const SECTION_CENTERED_SPLIT_SUFFIX = 'centered';

/** Разделитель узкой раскладки: у записи своя рамка, поэтому линия видна только при наведении и перетаскивании. */
export const SECTION_SPLIT_HANDLE_SUBTLE_CLASS =
  'w-px border-l border-transparent transition-colors data-[state=drag]:border-primary data-[state=hover]:border-accented';
