import ms from 'ms';

/**
 * Начала адресов, которые режим обновления не трогает: API (в нём и вход),
 * сборка и острова Nuxt, файлы хранилища, онлайн-счётчик, картинки, совместный
 * план бастиона. Иначе у администратора не заработал бы ни вход, ни сам сайт.
 * Внутренний `/__nuxt_error` здесь не указан намеренно: это рендер страницы
 * ошибки, и при закрытом сайте он тоже должен стать заглушкой.
 */
export const MAINTENANCE_PASSTHROUGH_PREFIXES = [
  '/api/',
  '/_nuxt/',
  '/__nuxt_island',
  '/_ipx/',
  '/s3/',
  '/online/',
  '/iv/',
  '/bastion-plan-sync',
];

/** Методы, которыми открывают страницы. */
export const MAINTENANCE_PAGE_METHODS = ['GET', 'HEAD'];

/** Последний кусок адреса с расширением — это файл, а не страница. */
export const MAINTENANCE_FILE_PATH_PATTERN = /\.[a-z0-9]+$/i;

/** Тип ответа, который просит браузер, открывая страницу. */
export const MAINTENANCE_HTML_ACCEPT = 'text/html';

/** Ответ заглушки: «сервис временно недоступен». */
export const MAINTENANCE_STATUS_CODE = 503;

export const MAINTENANCE_STATUS_MESSAGE = 'Service Unavailable';

/** Через сколько секунд стоит зайти снова (заголовок `Retry-After`). */
export const MAINTENANCE_RETRY_AFTER_SECONDS = ms('1h') / 1000;

/**
 * Пока режим включён, страницы не кешируются нигде: иначе заглушка могла бы
 * достаться администратору из кеша, а открытая страница — посетителю.
 */
export const MAINTENANCE_CACHE_CONTROL = 'no-store';

/** Заглушка не должна попасть в поиск. */
export const MAINTENANCE_ROBOTS_TAG = 'noindex, nofollow';

export const MAINTENANCE_RETRY_AFTER_HEADER = 'retry-after';

export const MAINTENANCE_ROBOTS_HEADER = 'x-robots-tag';

/** Метка ошибок режима обновления в логе. */
export const MAINTENANCE_ERROR_LOG = '[Maintenance Error]:';

/** Файл настройки не разбирается как JSON. */
export const MAINTENANCE_SETTINGS_INVALID_JSON_LOG =
  '[Maintenance] Settings file is not a valid JSON:';

/** JSON настройки не совпал со схемой. */
export const MAINTENANCE_SETTINGS_INVALID_FORMAT_LOG =
  '[Maintenance] Settings file has unexpected format';

/** Хранилище не ответило — сайт считается закрытым. */
export const MAINTENANCE_SETTINGS_READ_FAILED_LOG =
  '[Maintenance] Settings are unavailable, the site is treated as closed:';
