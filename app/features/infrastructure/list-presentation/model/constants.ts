import type { ButtonProps } from '@nuxt/ui';

import type { ListViewColumns, ListViewMode, ListViewModeState } from './types';

export const LIST_PRESENTATION_GROUPING_STORAGE_SUFFIX = 'list-grouping';
export const LIST_PRESENTATION_SORTING_STORAGE_SUFFIX = 'list-sorting';

export const LIST_PRESENTATION_GROUPING_LABEL = 'Группировка';
export const LIST_PRESENTATION_SORTING_LABEL = 'Сортировка';
export const LIST_PRESENTATION_GROUPING_ICON = 'tabler:category';
export const LIST_PRESENTATION_SORTING_ICON = 'tabler:sort-ascending';

// Режим отображения общий для всех разделов, поэтому ключ не привязан к
// sectionKey, в отличие от группировки и сортировки: там префикс — раздел
// (`bestiary:list-grouping`), здесь — сама фича.
export const LIST_VIEW_MODE_STORAGE_KEY = 'list-presentation:view-mode';

export const LIST_VIEW_MODE_DEFAULT: ListViewMode = 'grid';

// Сетка ограничена тремя колонками — столько же было захардкожено на страницах
// разделов до появления переключателя и стоит дефолтом в GroupedList.
export const LIST_VIEW_MODE_GRID_COLUMNS: ListViewColumns = 3;

export const LIST_VIEW_MODE_LIST_COLUMNS: ListViewColumns = 1;

// Подпись группы кнопок: без неё скринридер читает пару как два независимых
// переключателя, а не как выбор одного режима из двух.
export const LIST_VIEW_MODE_GROUP_LABEL = 'Режим отображения списка';

export const LIST_VIEW_MODE_OPTIONS = [
  { value: 'grid', label: 'Сеткой', icon: 'tabler:layout-grid' },
  { value: 'list', label: 'Списком', icon: 'tabler:list' },
] as const;

// Активный режим подсвечивается заливкой, неактивный остаётся нейтральным — так
// пара кнопок читается как переключатель, а не как два независимых действия.
export const LIST_VIEW_MODE_COLORS = {
  active: 'primary',
  inactive: 'neutral',
} as const satisfies Record<ListViewModeState, ButtonProps['color']>;

export const LIST_VIEW_MODE_VARIANTS = {
  active: 'solid',
  inactive: 'subtle',
} as const satisfies Record<ListViewModeState, ButtonProps['variant']>;
