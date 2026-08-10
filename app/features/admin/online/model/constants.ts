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

/**
 * Вторая аудитория VTTG: люди за чужими столами. Приложения у них нет — только вкладка
 * браузера с чужим миром, поэтому сервис онлайна держит их отдельным сайтом, иначе один
 * человек с открытой панелью и открытым миром получил бы два ключа и стал бы двумя.
 * Своей карточки у них нет: в отрыве от приложения эта аудитория ничего не значит.
 */
export const ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID = 'vttg-play';

export const ADMIN_ONLINE_STATS_VTTG_SITE_LABEL = 'Приложение';

export const ADMIN_ONLINE_STATS_VTTG_APPS_LABEL = 'Запущено приложений';

/**
 * Три строки «Из них» — доли запущенных приложений, а не слагаемые: играющий под
 * аккаунтом попадает и в «играют», и в «вошли в аккаунт». «Из них» проговаривает это в
 * подписи, чтобы числа не пытались сложить.
 */
export const ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL = 'Из них играют в мирах';

export const ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL = 'Из них просто открыто';

export const ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL =
  'Из них вошли в аккаунт';

export const ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL = 'Игроков за столами';

export const ADMIN_ONLINE_STATS_VTTG_TOTAL_LABEL = 'Всего людей';

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
