import type {
  AdminOnlineHistoryMetric,
  AdminOnlineHistoryMetricSection,
  AdminOnlinePreferenceSection,
  AdminOnlineUsageSection,
} from './types';

import { ADMIN_DASHBOARD_EMPTY_VALUE } from '~admin/dashboard/model';
import { DM_SCREEN_TITLE, DM_SCREEN_USAGE_FEATURE } from '~dm-screen/model';
import { LIST_VIEW_OPTIONS } from '~infrastructure/list-presentation/model';
import {
  LAYOUT_WIDTH_OPTIONS,
  LAYOUT_WIDTH_SECTION_TITLE,
  LIST_VIEW_SETTING_TITLE,
  SECTION_LAYOUT_OPTIONS,
  SECTION_LAYOUT_SETTING_TITLE,
  THEME_OPTIONS,
  THEME_SECTION_TITLE,
} from '~infrastructure/sidebar/display-settings';

export const ADMIN_ONLINE_STATS_API_URL = '/api/v2/online/stats';

export const ADMIN_ONLINE_STATS_DATA_KEY = 'admin-online-stats';

export const ADMIN_ONLINE_STATS_TITLE = 'Сайты онлайн';

export const ADMIN_ONLINE_STATS_DESCRIPTION =
  'Сколько людей на каждом сайте за последнее окно учёта.';

/** Общий итог online-app: сумма всех площадок, поэтому стоит над панелями, а не в одной из них. */
export const ADMIN_ONLINE_STATS_SUMMARY_LABEL = 'Онлайн';

export const ADMIN_ONLINE_STATS_SUMMARY_HINT =
  'Сумма по всем площадкам — сайтам и VTTG — за последнее окно учёта.';

export const ADMIN_ONLINE_STATS_WINDOW_LABEL = 'Окно';

export const ADMIN_ONLINE_STATS_MINUTES_LABEL = 'мин';

export const ADMIN_ONLINE_STATS_GUESTS_LABEL = 'Гостей';

/** VTTG — десктопное приложение, а не сайт, поэтому подписи у него свои. */
export const ADMIN_ONLINE_STATS_VTTG_SITE_ID = 'vttg';

/** VTTG живёт своей панелью: его числа устроены иначе, чем у сайтов. */
export const ADMIN_ONLINE_STATS_VTTG_TITLE = 'VTTG онлайн';

export const ADMIN_ONLINE_STATS_VTTG_DESCRIPTION =
  'Запущенные приложения и игроки за чужими столами за последнее окно учёта.';

/**
 * Вторая аудитория VTTG: люди за чужими столами. Приложения у них нет — только вкладка
 * браузера с чужим миром, поэтому сервис онлайна держит их отдельным сайтом, иначе один
 * человек с открытой панелью и открытым миром получил бы два ключа и стал бы двумя.
 * Своей плитки у них нет: в отрыве от приложения эта аудитория ничего не значит.
 */
export const ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID = 'vttg-play';

/**
 * Подписи чисел панели приложения.
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
 * Три числа под «Запущено» — доли запущенных приложений, а не слагаемые: играющий под
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

/** Итог панели приложения: что в нём сложено, говорит подсказка. */
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
  90: '90 дней',
};

export const ADMIN_ONLINE_PREFERENCES_PERCENT_SIGN = '%';

/** Доля варианта считается в процентах: столько составляет итог настройки. */
export const ADMIN_ONLINE_PREFERENCES_SHARE_MAX = 100;

/** Разделитель числа и доли в строке настройки */
export const ADMIN_ONLINE_PREFERENCES_SHARE_SEPARATOR = ' · ';

/**
 * Ширина сайта отдельно не выбирается: её ставит раскладка. Поэтому «Ширина» —
 * это та же раскладка, сложенная в две группы, и подсказки говорят, какая куда.
 */
export const ADMIN_ONLINE_PREFERENCES_WIDTH_HINT =
  'Ширину ставит выбранная раскладка. Обычная — «Узкая · запись поверх списка». Широкая — все остальные семь, в том числе «Узкая · список и запись рядом»: там узкая только колонка по центру.';

export const ADMIN_ONLINE_PREFERENCES_LAYOUT_HINT =
  'Раскладка разделов справочника. «Узкая · запись поверх списка» даёт обычную ширину сайта, остальные — широкую.';

export const ADMIN_ONLINE_PREFERENCES_LIST_HINT =
  'Вид списков разделов: карточками до двух, трёх или четырёх колонок либо строками. Кто вид не менял, учтён в «До трёх колонок».';

/**
 * Ширма Мастера: открыть её мало, считается работа с ней. Имя инструмента то
 * же, под которым его шлёт страница ширмы на обоих сайтах.
 */
export const ADMIN_ONLINE_DM_SCREEN_USAGE: AdminOnlineUsageSection = {
  feature: DM_SCREEN_USAGE_FEATURE,
  hint: 'Кто работает с ширмой, а не просто её открыл. День человека засчитан, если он провёл за ширмой не меньше 5 минут: вкладка на экране, и он что-то делал на странице.',
  title: DM_SCREEN_TITLE,
};

/** Главное число плитки площадки: люди хотя бы с одним засчитанным днём. */
export const ADMIN_ONLINE_USAGE_USERS_HINT =
  'Сколько разных людей за период работали с ширмой хотя бы в один день.';

export const ADMIN_ONLINE_USAGE_VISITORS_LABEL = 'Открыли';

export const ADMIN_ONLINE_USAGE_VISITORS_HINT =
  'Сколько разных людей открывали страницу ширмы — вместе с теми, кто сразу ушёл.';

export const ADMIN_ONLINE_USAGE_RETURNING_LABEL = 'Вернулись';

export const ADMIN_ONLINE_USAGE_RETURNING_HINT =
  'Сколько разных людей работали с ширмой в два разных дня и больше.';

export const ADMIN_ONLINE_USAGE_AVERAGE_LABEL = 'В среднем';

export const ADMIN_ONLINE_USAGE_AVERAGE_HINT =
  'Сколько времени человек проводит за ширмой в день, когда ей пользуется.';

/** Единицы времени работы с инструментом. */
export const ADMIN_ONLINE_USAGE_MINUTES_UNIT = 'мин';

export const ADMIN_ONLINE_USAGE_HOURS_UNIT = 'ч';

export const ADMIN_ONLINE_USAGE_MINUTES_IN_HOUR = 60;

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
      hint: ADMIN_ONLINE_PREFERENCES_WIDTH_HINT,
      name: 'width',
      options: LAYOUT_WIDTH_OPTIONS,
      title: LAYOUT_WIDTH_SECTION_TITLE,
    },
    {
      hint: ADMIN_ONLINE_PREFERENCES_LAYOUT_HINT,
      name: 'layout',
      options: SECTION_LAYOUT_OPTIONS,
      title: SECTION_LAYOUT_SETTING_TITLE,
      wide: true,
    },
    {
      hint: ADMIN_ONLINE_PREFERENCES_LIST_HINT,
      name: 'list',
      options: LIST_VIEW_OPTIONS,
      title: LIST_VIEW_SETTING_TITLE,
      wide: true,
    },
  ];

/**
 * Посещаемость по суткам. Берём сразу самый длинный период: остальные — его хвост,
 * и переключение периода не ждёт сети.
 */
export const ADMIN_ONLINE_HISTORY_API_URL = '/api/v2/online/history';

export const ADMIN_ONLINE_HISTORY_DATA_KEY = 'admin-online-history';

export const ADMIN_ONLINE_HISTORY_PERIODS: ReadonlyArray<number> = [7, 30, 90];

export const ADMIN_ONLINE_HISTORY_DEFAULT_PERIOD = 30;

export const ADMIN_ONLINE_HISTORY_REQUEST_DAYS = Math.max(
  ...ADMIN_ONLINE_HISTORY_PERIODS,
);

export const ADMIN_ONLINE_HISTORY_TITLE = 'Посещаемость';

export const ADMIN_ONLINE_HISTORY_HINT =
  'Как менялась посещаемость по суткам (по московскому времени). Сервис начал копить историю с момента выкладки: до этого дня данных нет. Сегодняшние сутки ещё не закончились.';

/** Площадка «все вместе»: посетители в ней — разные люди со всех площадок, а не сумма. */
export const ADMIN_ONLINE_HISTORY_ALL_SITES = 'all';

export const ADMIN_ONLINE_HISTORY_ALL_SITES_LABEL = 'Все';

/** Подписи площадок в переключателе; незнакомая подписывается своим кодом. */
export const ADMIN_ONLINE_HISTORY_SITE_LABELS: Readonly<
  Record<string, string>
> = {
  [ADMIN_ONLINE_STATS_VTTG_SITE_ID]: 'VTTG',
  [ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID]: 'VTTG за столами',
};

export const ADMIN_ONLINE_HISTORY_METRICS: ReadonlyArray<AdminOnlineHistoryMetricSection> =
  [
    {
      hint: 'Сколько разных людей заходило за сутки — гости и вошедшие вместе. Число на плитке — среднее за сутки периода.',
      label: 'Посетители',
      metric: 'visitors',
      summary: 'average',
    },
    {
      hint: 'Самый большой онлайн за сутки — по тому же окну учёта, что и «Онлайн» в шапке. Число на плитке — лучшие сутки периода.',
      label: 'Пик онлайна',
      metric: 'peakOnline',
      summary: 'maximum',
    },
    {
      hint: 'Сколько людей было онлайн в среднем за сутки: сервис замеряет онлайн каждые несколько минут. Число на плитке — среднее за период.',
      label: 'Средний онлайн',
      metric: 'averageOnline',
      summary: 'average',
    },
  ];

/** Пояснение под числом плитки, сводящей период средним. */
export const ADMIN_ONLINE_HISTORY_AVERAGE_CAPTION = 'в среднем за сутки';

/** Пояснение под числом плитки лучших суток: перед датой. */
export const ADMIN_ONLINE_HISTORY_MAXIMUM_CAPTION_PREFIX = 'максимум';

export const ADMIN_ONLINE_HISTORY_EMPTY_TEXT =
  'За этот период данных ещё нет: история копится с момента выкладки сервиса.';

export const ADMIN_ONLINE_HISTORY_ERROR_TEXT =
  'История посещаемости пока не собирается: online-app её не отдаёт.';

export const ADMIN_ONLINE_HISTORY_PEAK_TIME_LABEL = 'Пик в';

/** Числа графика: средний онлайн дробный, остальное — целые люди. */
export const ADMIN_ONLINE_HISTORY_AVERAGE_FORMAT = new Intl.NumberFormat(
  'ru-RU',
  { maximumFractionDigits: 1 },
);

/**
 * Даты приходят строкой `YYYY-MM-DD` без часового пояса: разбираем их как полночь
 * UTC и так же выводим, иначе в западных поясах сутки уехали бы на день назад.
 */
export const ADMIN_ONLINE_HISTORY_AXIS_DATE_FORMAT = new Intl.DateTimeFormat(
  'ru-RU',
  { day: 'numeric', month: 'short', timeZone: 'UTC' },
);

export const ADMIN_ONLINE_HISTORY_TOOLTIP_DATE_FORMAT = new Intl.DateTimeFormat(
  'ru-RU',
  { day: 'numeric', month: 'long', timeZone: 'UTC', weekday: 'short' },
);

/** Время пика — по Москве, как и сами сутки. */
export const ADMIN_ONLINE_HISTORY_PEAK_TIME_FORMAT = new Intl.DateTimeFormat(
  'ru-RU',
  { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' },
);

/** Размеры графика в пикселях; ширину задаёт контейнер. */
export const ADMIN_ONLINE_HISTORY_CHART_HEIGHT = 180;

export const ADMIN_ONLINE_HISTORY_CHART_PADDING = {
  bottom: 22,
  left: 44,
  right: 12,
  top: 10,
};

/** Сколько горизонтальных линий сетки над нулём. */
export const ADMIN_ONLINE_HISTORY_CHART_GRID_LINES = 3;

/** Не больше стольких подписей дат под осью — остальные пропускаются через равный шаг. */
export const ADMIN_ONLINE_HISTORY_CHART_MAX_AXIS_LABELS = 7;

/** Радиус точек: обычной и той, над которой указатель. */
export const ADMIN_ONLINE_HISTORY_CHART_POINT_RADIUS = 2.5;

export const ADMIN_ONLINE_HISTORY_CHART_ACTIVE_POINT_RADIUS = 4;

/** До стольких суток точки рисуются на каждом дне; дальше — только линия. */
export const ADMIN_ONLINE_HISTORY_CHART_POINTS_MAX_DAYS = 31;

/** Шаги «круглых» значений шкалы внутри десятичного разряда. */
export const ADMIN_ONLINE_HISTORY_CHART_NICE_STEPS: ReadonlyArray<number> = [
  1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10,
];

export const ADMIN_ONLINE_HISTORY_CHART_DECIMAL_BASE = 10;

/** Подписи строк подсказки над точкой графика. */
export const ADMIN_ONLINE_HISTORY_GUESTS_LABEL =
  ADMIN_ONLINE_STATS_GUESTS_LABEL;

export const ADMIN_ONLINE_HISTORY_REGISTERED_LABEL =
  ADMIN_ONLINE_STATS_REGISTERED_LABEL;

/** Подпись графика для экранных чтецов: за ней идёт название показателя. */
export const ADMIN_ONLINE_HISTORY_CHART_LABEL = 'График по суткам';

/** Прозрачность заливки под линией и ореола у точки под указателем. */
export const ADMIN_ONLINE_HISTORY_CHART_AREA_OPACITY = 0.12;

export const ADMIN_ONLINE_HISTORY_CHART_GRID_OPACITY = 0.25;

export const ADMIN_ONLINE_HISTORY_CHART_CURSOR_OPACITY = 0.5;

export const ADMIN_ONLINE_HISTORY_CHART_CURSOR_DASH = '3 3';

export const ADMIN_ONLINE_HISTORY_CHART_LINE_WIDTH = 2;

export const ADMIN_ONLINE_HISTORY_CHART_HALO_RADIUS = 8;

/** Зазор между шкалой и подписями чисел слева. */
export const ADMIN_ONLINE_HISTORY_CHART_LABEL_GAP = 8;

/** Отступ подписей дат от нижнего края графика. */
export const ADMIN_ONLINE_HISTORY_CHART_LABEL_BASELINE = 4;

/** Зазор между точкой и подсказкой над ней. */
export const ADMIN_ONLINE_HISTORY_CHART_TOOLTIP_OFFSET = 12;

/**
 * Плитки показателей — ещё и переключатели: подсказка всплывает не сразу, чтобы не
 * закрывать соседнюю плитку, пока по ним щёлкают.
 */
export const ADMIN_ONLINE_HISTORY_METRIC_HINT_DELAY = 600;

/** Сколько пикселей ширины нужно одной подписи даты под осью, чтобы соседние не слипались. */
export const ADMIN_ONLINE_HISTORY_CHART_AXIS_LABEL_MIN_WIDTH = 72;

/** Показатель, который график рисует при открытии панели. */
export const ADMIN_ONLINE_HISTORY_DEFAULT_METRIC: AdminOnlineHistoryMetric =
  'visitors';

/** Плитка показателя: выбранная подсвечена полосой снизу. */
export const ADMIN_ONLINE_HISTORY_METRIC_ACTIVE_CLASS =
  'border-primary bg-elevated/50';

export const ADMIN_ONLINE_HISTORY_METRIC_IDLE_CLASS =
  'border-transparent hover:bg-elevated/30';
