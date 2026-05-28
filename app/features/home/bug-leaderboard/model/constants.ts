/** Ключ кеширования для useAsyncData статистики баг-репортов */
export const BUG_LEADERBOARD_DATA_KEY = 'bug-leaderboard-stats';

/** Интервал автообновления статистики (мс) — 60 секунд */
export const BUG_LEADERBOARD_REFRESH_INTERVAL_MS = 60 * 1000;

/** Цвет иконки кубка */
export const BUG_LEADERBOARD_TROPHY_COLOR = 'var(--color-warning-400)';

/** Текстовые константы для заголовков и подписей */
export const BUG_LEADERBOARD_TITLE = 'Охотники за багами';
export const BUG_LEADERBOARD_LABEL_SENT = 'Отправлено';
export const BUG_LEADERBOARD_LABEL_FIXED = 'Исправлено';
export const BUG_LEADERBOARD_LABEL_TOP = 'Топ охотников';

/** Подсказка для топа охотников */
export const BUG_LEADERBOARD_TOP_TOOLTIP =
  'В зачёт идут только те баги, которые мы отметили как исправленные, а не просто все ваши отправленные баги';
