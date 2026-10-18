/** Ручка статистики листов; её же читает счётчик на главной (~home/community) */
export const ADMIN_SHEET_STATS_API_URL = '/api/v2/statistics/character-sheets';

export const ADMIN_SHEET_STATS_DATA_KEY = 'admin-character-sheet-stats';

export const ADMIN_SHEET_STATS_TITLE = 'Листы персонажа';

/** Площадка, на которой живут листы, — пометкой рядом с подписью плитки. */
export const ADMIN_SHEET_STATS_SITE_VALUE = '2024';

export const ADMIN_SHEET_STATS_ACTIVE_LABEL = 'Активных';

export const ADMIN_SHEET_STATS_TOTAL_HINT =
  'Всего листов: активные и лежащие в истории удалённых.';

export const ADMIN_SHEET_STATS_ERROR_TEXT =
  'Не удалось загрузить статистику листов.';
