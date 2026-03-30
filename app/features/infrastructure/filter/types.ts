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
  union?: boolean; // true = OR

  values?: FilterItems;
}

export type FilterGroups = Array<FilterGroup>;

export interface FilterItem {
  id: string | number; // For fetching query param
  value: string; // Used internally or for display
  name: string;
  selected: boolean | null; // UI state
  [p: string]: unknown;
}

export type FilterItems = Array<FilterItem>;

export interface Filter {
  filters: FilterGroups;
  sources?: FilterGroups;
}
