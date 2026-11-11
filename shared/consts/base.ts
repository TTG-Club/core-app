export const USER_TOKEN_COOKIE = 'ttg-user-token';

export const USER_REFRESH_TOKEN_COOKIE = 'ttg-user-refresh-token';

export const THEME_STORE_KEY = 'ttg-theme';

/** Настройки своей темы: основа, акцент и оттенок фона. */
export const CUSTOM_THEME_STORE_KEY = 'ttg-custom-theme';

export const LAYOUT_WIDTH_STORE_KEY = 'ttg-layout-width';

export const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

/** Год в секундах: срок хранения кук с настройками отображения. */
export const ONE_YEAR_IN_SECONDS = ONE_DAY_IN_SECONDS * 365;

/**
 * Начало имени куки с выбранным фильтром раздела: выбор переживает
 * перезагрузку и новый заход, а сервер сразу отдаёт отфильтрованный список.
 */
export const SECTION_FILTER_STORE_KEY_PREFIX = 'ttg-section-';

/** Колонка фильтров разделов свёрнута в строку над списком (широкий режим). */
export const SECTION_FILTERS_COLLAPSED_STORE_KEY =
  'ttg-section-filters-collapsed';

/** С какой стороны стоит колонка фильтров разделов (широкий режим). */
export const SECTION_FILTERS_SIDE_STORE_KEY = 'ttg-section-filters-side';

/** С какой стороны от списка стоит карточка записи (широкий режим). */
export const SECTION_DETAIL_SIDE_STORE_KEY = 'ttg-section-detail-side';

/**
 * Разделы в узкой колонке по центру: список и запись делят её пополам, как на
 * старом сайте 5e14 (широкий режим).
 */
export const SECTION_CENTERED_STORE_KEY = 'ttg-section-centered';

/** Запись в узкой колонке развёрнута на всю её ширину поверх списка. */
export const SECTION_DETAIL_EXPANDED_STORE_KEY = 'ttg-section-detail-expanded';
