export const ADMIN_ONLINE_STATS_API_URL = '/api/v2/online/stats';

export const ADMIN_ONLINE_STATS_DATA_KEY = 'admin-online-stats';

export const ADMIN_ONLINE_STATS_TITLE = 'Пользователи онлайн';

export const ADMIN_ONLINE_STATS_DESCRIPTION =
  'Статистика активности по сайтам за последнее окно учета.';

export const ADMIN_ONLINE_STATS_WINDOW_LABEL = 'Окно';

export const ADMIN_ONLINE_STATS_MINUTES_LABEL = 'мин';

export const ADMIN_ONLINE_STATS_SITE_LABEL = 'Сайт';

export const ADMIN_ONLINE_STATS_GUESTS_LABEL = 'Гостей';

/** VTTG — десктопное приложение, а не сайт, поэтому подписи у него свои. */
export const ADMIN_ONLINE_STATS_VTTG_SITE_ID = 'vttg';

export const ADMIN_ONLINE_STATS_VTTG_SITE_LABEL = 'Приложение';

/**
 * У приложения обе строки — подмножества итога, а не слагаемые: играющий под аккаунтом
 * попадает в обе. «Из них» проговаривает это в подписи, чтобы числа не пытались сложить.
 */
export const ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL = 'Из них играют в мирах';

export const ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL =
  'Из них вошли в аккаунт';

export const ADMIN_ONLINE_STATS_REGISTERED_LABEL = 'Пользователей';

export const ADMIN_ONLINE_STATS_TOTAL_LABEL = 'Всего';

export const ADMIN_ONLINE_STATS_SUMMARY_LABEL = 'Всего';

export const ADMIN_ONLINE_STATS_REFRESH_LABEL = 'Обновить';

/**
 * Каркас сетки: карточки этих площадок держим на месте всегда — и пока данных
 * нет, и когда online-app упал. Реальный ответ их заменяет, так что расхождение
 * со списком бэкенда живёт ровно до первого успешного запроса.
 */
export const ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS = [
  '5e14',
  '5e24',
  ADMIN_ONLINE_STATS_VTTG_SITE_ID,
];

/** Значение, которого нет: числа не выдумываем, ставим прочерк. */
export const ADMIN_ONLINE_STATS_EMPTY_VALUE = '—';

export const ADMIN_ONLINE_STATS_EMPTY_TEXT =
  'Online-app пока не вернул сайты для отображения.';
