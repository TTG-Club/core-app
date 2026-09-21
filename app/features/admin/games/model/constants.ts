import { FIND_GAME_API_PREFIX } from '#shared/consts';

/** Счётчики игр отдаёт find-game-api, а не core-api. */
export const ADMIN_GAME_STATISTICS_API_URL = `${FIND_GAME_API_PREFIX}/admin/statistics/games`;
/** Ключ кеша счётчиков игр на дашборде. */
export const ADMIN_GAME_STATISTICS_DATA_KEY = 'admin-game-stats';
/** Предел ожидания ответа сервиса игр, мс. */
export const ADMIN_GAME_STATISTICS_REQUEST_TIMEOUT = 20_000;
export const ADMIN_GAME_STATISTICS_NUMBER_FORMAT = new Intl.NumberFormat(
  'ru-RU',
);
export const ADMIN_GAME_STATISTICS_TITLE = 'Игры';
export const ADMIN_GAME_STATISTICS_TOTAL_LABEL = 'Всего игр';
export const ADMIN_GAME_STATISTICS_COMPLETED_LABEL = 'Завершено';
export const ADMIN_GAME_STATISTICS_ERROR_TEXT =
  'Не удалось загрузить статистику игр. Нажмите «Обновить».';
