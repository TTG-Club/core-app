export const LIST_PRESENTATION_GROUPING_STORAGE_SUFFIX = 'list-grouping';
export const LIST_PRESENTATION_SORTING_STORAGE_SUFFIX = 'list-sorting';

export const LIST_PRESENTATION_GROUPING_LABEL = 'Группировка';
export const LIST_PRESENTATION_SORTING_LABEL = 'Сортировка';
export const LIST_PRESENTATION_GROUPING_ICON = 'tabler:category';
export const LIST_PRESENTATION_SORTING_ICON = 'tabler:sort-ascending';

/** Хранилище вида списка — общего для всех разделов. */
export const LIST_VIEW_STORAGE_KEY = 'ttg-list-view';

/**
 * Вид списка: карточками в несколько колонок или строками в одну колонку,
 * где названия не обрезаются.
 */
export const LIST_VIEW_OPTIONS = [
  { value: 'grid', label: 'Карточками', icon: 'tabler:layout-grid' },
  { value: 'rows', label: 'Строками', icon: 'tabler:layout-list' },
] as const;

/** Строками — одна колонка. */
export const LIST_VIEW_ROWS_COLUMNS = 1;
