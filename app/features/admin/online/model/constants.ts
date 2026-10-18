import type { AdminOnlinePreferenceSection } from './types';

import { ADMIN_DASHBOARD_EMPTY_VALUE } from '~admin/dashboard/model';
import {
  LAYOUT_WIDTH_OPTIONS,
  LAYOUT_WIDTH_SECTION_TITLE,
  THEME_OPTIONS,
  THEME_SECTION_TITLE,
} from '~infrastructure/sidebar/display-settings';

export const ADMIN_ONLINE_STATS_API_URL = '/api/v2/online/stats';

export const ADMIN_ONLINE_STATS_DATA_KEY = 'admin-online-stats';

export const ADMIN_ONLINE_STATS_TITLE = 'Онлайн сейчас';

export const ADMIN_ONLINE_STATS_DESCRIPTION =
  'Сколько людей на каждой площадке за последнее окно учёта.';

export const ADMIN_ONLINE_STATS_WINDOW_LABEL = 'Окно';

export const ADMIN_ONLINE_STATS_MINUTES_LABEL = 'мин';

export const ADMIN_ONLINE_STATS_GUESTS_LABEL = 'Гостей';

/** VTTG — десктопное приложение, а не сайт, поэтому подписи у него свои. */
export const ADMIN_ONLINE_STATS_VTTG_SITE_ID = 'vttg';

/**
 * Вторая аудитория VTTG: люди за чужими столами. Приложения у них нет — только вкладка
 * браузера с чужим миром, поэтому сервис онлайна держит их отдельным сайтом, иначе один
 * человек с открытой панелью и открытым миром получил бы два ключа и стал бы двумя.
 * Своей плитки у них нет: в отрыве от приложения эта аудитория ничего не значит.
 */
export const ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID = 'vttg-play';

/**
 * Подписи чисел плитки приложения.
 *
 * Чисел у приложения вшестеро больше, чем у сайта, поэтому подписи короткие, а весь
 * смысл вынесен в подсказку рядом: правило «текст целиком» для компактных плиток-чисел
 * с подсказкой не действует. Подписи короткие, но не обрубленные — сокращений с точкой
 * тут нет, иначе читать пришлось бы по догадке.
 */
export const ADMIN_ONLINE_STATS_VTTG_APPS_LABEL = 'Запущено';

export const ADMIN_ONLINE_STATS_VTTG_APPS_HINT =
  'Сколько человек держат приложение открытым. Один человек считается один раз, сколько бы окон он ни открыл.';

export const ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL = 'За столами';

export const ADMIN_ONLINE_STATS_VTTG_TABLE_HINT =
  'Игроки, пришедшие в чужой мир по ссылке: приложение у них не запущено, только вкладка браузера.';

/**
 * Три числа помельче — доли запущенных приложений, а не слагаемые: играющий под
 * аккаунтом попадает и в «В игре», и в «Аккаунт». Что это доли, проговаривают подсказки.
 */
export const ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL = 'В игре';

export const ADMIN_ONLINE_STATS_VTTG_PLAYERS_HINT =
  'Из запущенных приложений: сколько человек прямо сейчас на игровой сцене.';

export const ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL = 'Вне игры';

export const ADMIN_ONLINE_STATS_VTTG_IDLE_HINT =
  'Из запущенных приложений: сколько человек открыли приложение, но в мир не заходили.';

export const ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL = 'Аккаунт';

export const ADMIN_ONLINE_STATS_VTTG_REGISTERED_HINT =
  'Из запущенных приложений: сколько вошли в аккаунт TTG. Остальных считаем по идентификатору браузера.';

/** Главное число плитки приложения: что в нём сложено, говорит подсказка. */
export const ADMIN_ONLINE_STATS_VTTG_TOTAL_HINT =
  'Всего людей: запущенные приложения и игроки за столами — разные люди, поэтому складываются.';

export const ADMIN_ONLINE_STATS_REGISTERED_LABEL = 'Пользователей';

export const ADMIN_ONLINE_STATS_TOTAL_LABEL = 'Всего';

/**
 * Каркас панели: плитки этих площадок держим на месте всегда — и пока данных
 * нет, и когда online-app упал. Реальный ответ их заменяет, так что расхождение
 * со списком бэкенда живёт ровно до первого успешного запроса.
 */
export const ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS = [
  '5e14',
  '5e24',
  ADMIN_ONLINE_STATS_VTTG_SITE_ID,
];

/** Значение, которого нет: числа не выдумываем, ставим прочерк. */
export const ADMIN_ONLINE_STATS_EMPTY_VALUE = ADMIN_DASHBOARD_EMPTY_VALUE;

export const ADMIN_ONLINE_STATS_EMPTY_TEXT =
  'Online-app пока не вернул сайты для отображения.';

/** Срезы настроек — единственная статистика за период, поэтому период выбирается здесь. */
export const ADMIN_ONLINE_PREFERENCES_TITLE = 'Настройки отображения';

export const ADMIN_ONLINE_PREFERENCES_PERIOD_HINT =
  'Сколько разных посетителей пользовались каждым вариантом. Кто переключался за период, учтён в обоих вариантах, поэтому «Всего» может быть больше числа людей.';

/** Подписи периодов; период, которого здесь нет, подписывается числом дней. */
export const ADMIN_ONLINE_PREFERENCES_PERIOD_LABELS: Readonly<
  Record<number, string>
> = {
  1: 'Сегодня',
  7: '7 дней',
  30: '30 дней',
};

export const ADMIN_ONLINE_PREFERENCES_PERCENT_SIGN = '%';

/** Доля варианта считается в процентах: столько составляет итог настройки. */
export const ADMIN_ONLINE_PREFERENCES_SHARE_MAX = 100;

/** Разделитель числа и доли в строке настройки */
export const ADMIN_ONLINE_PREFERENCES_SHARE_SEPARATOR = ' · ';

/**
 * Какие настройки показываем. Имена совпадают с теми, под которыми браузер
 * передаёт их в heartbeat, а варианты — те же, что в панели настроек отображения.
 */
export const ADMIN_ONLINE_PREFERENCE_SECTIONS: ReadonlyArray<AdminOnlinePreferenceSection> =
  [
    {
      name: 'theme',
      options: THEME_OPTIONS,
      title: THEME_SECTION_TITLE,
    },
    {
      name: 'width',
      options: LAYOUT_WIDTH_OPTIONS,
      title: LAYOUT_WIDTH_SECTION_TITLE,
    },
  ];
