/**
 * Ключ кеширования для useAsyncData статистики баг-репортов.
 * Значение оставлено прежним для совместимости кеша после переноса блока.
 */
export const COMMUNITY_BUG_STATS_DATA_KEY = 'bug-leaderboard-stats';

/** Интервал автообновления статистики (мс) — 60 секунд */
export const COMMUNITY_REFRESH_INTERVAL_MS = 60 * 1000;

/** Цвет иконки кубка победителя */
export const COMMUNITY_TROPHY_COLOR = 'var(--color-warning-400)';

/** Подпись стата исправленных багов */
export const COMMUNITY_LABEL_FIXED = 'Исправлено';

/** Подзаголовок рейтинга охотников */
export const COMMUNITY_TOP_LABEL = 'Охотники за багами';

/** Подсказка к рейтингу охотников */
export const COMMUNITY_TOP_TOOLTIP =
  'В зачёт идут только те баги, которые мы отметили как исправленные, а не просто все ваши отправленные баги';
