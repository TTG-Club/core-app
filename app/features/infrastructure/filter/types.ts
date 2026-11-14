/**
 * Допустимые значения поля `key` в source-группах ответа `/api/v2/{section}/filters`.
 *
 * Бэкенд возвращает уникальный ключ типа источника (enum `SourceType` в UPPER_SNAKE_CASE).
 */
export type SourceTypeKey =
  | 'OFFICIAL'
  | 'SETTING'
  | 'MODULE'
  | 'TEST'
  | 'THIRD_PARTY'
  | 'CUSTOM';

export interface FilterGroup {
  key: string;
  name: string;
  type: 'filter';
  supports?: {
    mode: boolean;
    union: boolean;
  };

  // UI mutable states
  mode?: boolean; // true = exclude
  union?: boolean; // true = AND (точное совпадение)

  values?: FilterItems;
  /** Заданный доменом порядок значений для дискретного диапазона. */
  rangeOrder?: ReadonlyArray<string>;
}

/** Порядки диапазонов по ключам групп; задаются владельцем каталога. */
export type FilterRangeOrders = Readonly<Record<string, ReadonlyArray<string>>>;

export type FilterGroups = Array<FilterGroup>;

export interface FilterItem {
  id: string | number; // For fetching query param
  value: string; // Used internally or for display
  name: string;
  selected: boolean | null; // UI state
  relations?: Record<string, Array<string | number>>;
  /** Значение доступно, только когда в родителе выбрано связанное значение. */
  relationsRequired?: boolean;
  [p: string]: unknown;
}

export type FilterItems = Array<FilterItem>;

export interface Filter {
  filters: FilterGroups;
  sources?: FilterGroups;
}

/** Источник из общего списка сайта — то, что нужно панели выбора. */
export interface SourceCatalogRecord {
  /** Акроним источника, например `PHB`. */
  acronym: string;
  /** Русское название. */
  name: string;
  /** Английское название. */
  english: string;
  /** Адрес обложки; есть не у каждого источника. */
  image?: string;
}

/** Английское название и акроним источника. */
export interface SourceNames {
  acronym: string;
  english: string;
  image?: string;
}

/** Справочник названий источников: по акрониму и по русскому названию. */
export interface SourceCatalog {
  byAcronym: ReadonlyMap<string, SourceNames>;
  byName: ReadonlyMap<string, SourceNames>;
}

/** Строка панели выбора источников. */
export interface SourceEntry {
  item: FilterItem;
  /** Отмечен ли источник: у значения фильтра это `true`, иначе `null`. */
  selected: boolean;
  english?: string;
  acronym?: string;
  image?: string;
}
