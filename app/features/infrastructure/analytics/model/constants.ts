/** Адрес скрипта Яндекс.Метрики */
export const YANDEX_METRIKA_SCRIPT_URL = 'https://mc.yandex.ru/metrika/tag.js';

/** Ключ скрипта Яндекс.Метрики: по нему скрипт не подключается дважды */
export const YANDEX_METRIKA_SCRIPT_KEY = 'yandex-metrika';

/** Метод Метрики, запускающий счётчик */
export const YANDEX_METRIKA_INIT_METHOD = 'init';

/** Метод Метрики, отправляющий просмотр страницы */
export const YANDEX_METRIKA_HIT_METHOD = 'hit';

/** Метод остановки счётчика при завершении работы приложения. */
export const YANDEX_METRIKA_DESTRUCT_METHOD = 'destruct';

/**
 * Параметр адреса скрипта Google Analytics с идентификатором счётчика —
 * так адрес собирает и сам модуль `nuxt-gtag`.
 */
export const GOOGLE_ANALYTICS_ID_QUERY_PARAMETER = 'id';

/**
 * Атрибут скрипта Google Analytics. По нему `useGtag().initialize()` модуля
 * `nuxt-gtag` понимает, что скрипт уже подключён, и не вставляет второй.
 */
export const GOOGLE_ANALYTICS_SCRIPT_MARKER = 'data-gtag';

/** Адрес Nitro, который передаёт отметку присутствия в сервис учёта онлайна */
export const HEARTBEAT_URL = '/api/v2/online/heartbeat';

/** Как часто вкладка-лидер отправляет отметку присутствия — раз в 30 секунд */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000;

/** Минимальный промежуток между отметками: переключение вкладок не устраивает залп запросов */
export const HEARTBEAT_COOLDOWN_MS = 10 * 1000;

/** Имя блокировки Web Locks: отметки шлёт только одна вкладка из открытых */
export const HEARTBEAT_LOCK_NAME = 'ttg-online-heartbeat-leader';

/** Cookie со случайным идентификатором гостя для учёта онлайна */
export const ONLINE_VISITOR_ID_COOKIE = 'ttg-online-visitor-id';

/** Срок хранения идентификатора гостя — 400 дней, предел срока cookie в браузерах */
export const ONLINE_VISITOR_ID_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

/** Тип отметки для посетителя без входа в аккаунт */
export const VISITOR_ONLINE_TYPE = 'GUEST';

/** Тип отметки для вошедшего пользователя */
export const REGISTERED_ONLINE_TYPE = 'REGISTERED';

/** Адрес, принимающий отметки работы с инструментом сайта */
export const FEATURE_USAGE_URL = '/api/v2/online/usage';

/** Как часто проверяется, работает ли посетитель с инструментом, — раз в 15 секунд */
export const FEATURE_USAGE_SAMPLE_SECONDS = 15;

/** Тот же шаг проверки в миллисекундах — для таймера */
export const FEATURE_USAGE_SAMPLE_MS = FEATURE_USAGE_SAMPLE_SECONDS * 1000;

/** Сколько секунд работы копится до отправки отметки — минута */
export const FEATURE_USAGE_REPORT_SECONDS = 60;

/**
 * Сколько после последнего действия посетитель считается работающим — 15 минут.
 * Мастер подолгу читает запись, не трогая страницу, но забытая на экране вкладка
 * время не накручивает.
 */
export const FEATURE_USAGE_IDLE_MS = 15 * 60 * 1000;

/** Действия посетителя, по которым видно, что с инструментом работают */
export const FEATURE_USAGE_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'keydown',
  'wheel',
];

/** Отметка «инструмент открыт»: времени работы в ней ещё нет */
export const FEATURE_USAGE_OPENED_SECONDS = 0;

/**
 * Настройки счётчика — те же, что были при подключении через модуль
 * `nuxt-yandex-metrika`, поэтому статистика после смены способа подключения
 * считается как раньше. Первый просмотр счётчик отправляет сам при запуске.
 */
export const YANDEX_METRIKA_INIT_OPTIONS = {
  accurateTrackBounce: true,
  childIframe: true,
  clickmap: true,
  trackLinks: true,
  webvisor: true,
};
