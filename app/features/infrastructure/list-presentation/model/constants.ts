export const LIST_PRESENTATION_GROUPING_STORAGE_SUFFIX = 'list-grouping';
export const LIST_PRESENTATION_SORTING_STORAGE_SUFFIX = 'list-sorting';

export const LIST_PRESENTATION_GROUPING_LABEL = 'Группировка';
export const LIST_PRESENTATION_SORTING_LABEL = 'Сортировка';
export const LIST_PRESENTATION_GROUPING_ICON = 'tabler:category';
export const LIST_PRESENTATION_SORTING_ICON = 'tabler:sort-ascending';

/** Хранилище вида списка — общего для всех разделов. */
export const LIST_VIEW_STORAGE_KEY = 'ttg-list-view';

/**
 * Вид списка: карточками не больше чем в две, три или четыре колонки — но и
 * не больше, чем помещается по ширине, — или строками в одну колонку, где
 * названия не обрезаются.
 */
export const LIST_VIEW_OPTIONS = [
  { value: 'columns-2', label: 'До двух колонок', columns: 2 },
  { value: 'columns-3', label: 'До трёх колонок', columns: 3 },
  { value: 'columns-4', label: 'До четырёх колонок', columns: 4 },
  { value: 'rows', label: 'Строками', columns: 1 },
] as const;

/** Вид по умолчанию — до трёх колонок, как было до настройки. */
export const LIST_VIEW_DEFAULT = 'columns-3';
