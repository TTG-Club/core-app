export const LIST_PRESENTATION_GROUPING_STORAGE_SUFFIX = 'list-grouping';
export const LIST_PRESENTATION_SORTING_STORAGE_SUFFIX = 'list-sorting';

export const LIST_PRESENTATION_GROUPING_LABEL = 'Группировка';
export const LIST_PRESENTATION_SORTING_LABEL = 'Сортировка';
export const LIST_PRESENTATION_GROUPING_ICON = 'tabler:category';
export const LIST_PRESENTATION_SORTING_ICON = 'tabler:sort-ascending';

// Режим отображения общий для всех разделов, поэтому ключ не привязан к sectionKey, в отличие от группировки и сортировки.
export const LIST_VIEW_MODE_STORAGE_KEY = 'ui:list-view-mode';

export const LIST_VIEW_MODE_DEFAULT = 'grid';

// Сетка ограничена тремя колонками — столько же было захардкожено на страницах разделов до появления переключателя и стоит дефолтом в GroupedList.
export const LIST_VIEW_MODE_GRID_COLUMNS = 3;

export const LIST_VIEW_MODE_LIST_COLUMNS = 1;

export const LIST_VIEW_MODE_OPTIONS = [
  { value: 'grid', label: 'Сеткой', icon: 'tabler:layout-grid' },
  { value: 'list', label: 'Списком', icon: 'tabler:list' },
] as const;
