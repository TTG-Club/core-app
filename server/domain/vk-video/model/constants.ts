import ms from 'ms';

/**
 * Приложение VK ID «TTG Club - новости». Id не секретный: он и так виден в
 * адресе входа. В настройках приложения внесены домен сайта и адрес возврата
 * `/api/admin/vk/callback`.
 */
export const VK_ID_APP_ID = '54783145';

/** Сервер VK ID: страница входа и обмен/продление ключей. */
export const VK_ID_BASE_URL = 'https://id.vk.ru';

/** Права, которые просим при входе: открытые ролики читаются и с базовым. */
export const VK_ID_SCOPE = 'vkid.personal_info';

/** VK API и его версия. */
export const VK_API_BASE_URL = 'https://api.vk.com/method';
export const VK_API_VERSION = '5.199';

/** Код ошибки VK API «ключ недействителен» — продлеваем ключ и пробуем снова. */
export const VK_API_AUTH_ERROR_CODE = 5;

/**
 * Ошибки VK ID, после которых ключ уже не продлить: подключение снимаем,
 * администратору нужно войти заново.
 */
export const VK_ID_SESSION_LOST_ERRORS: ReadonlyArray<string> = [
  'invalid_grant',
  'invalid_token',
  'invalid_client',
  'access_denied',
];

/** Продлеваем ключ заранее, чтобы он не истёк посреди запроса. */
export const VK_ID_REFRESH_MARGIN_MS = ms('5m');

/**
 * Папка файлов подключения в служебной папке хранилища: у каждого редактора
 * свой файл `<username>.json`.
 */
export const VK_ID_SESSION_KEY_PREFIX = 'private/vk-video/users/';

/** Имя файла подключения — хранилище требует его при записи. */
export const VK_ID_SESSION_FILENAME = 'session.json';

/** Cookie незавершённого входа: проверочные строки PKCE и адрес возврата. */
export const VK_ID_LOGIN_COOKIE = 'vk-id-login';

/** Код VK ID живёт 10 минут — дольше незавершённый вход не храним. */
export const VK_ID_LOGIN_COOKIE_MAX_AGE_SECONDS = ms('10m') / 1000;

/** Длина проверочных строк PKCE и state (в байтах до base64url). */
export const VK_ID_CODE_VERIFIER_BYTES = 48;
export const VK_ID_STATE_BYTES = 24;

/** Предел ожидания ответа ВК. */
export const VK_REQUEST_TIMEOUT_MS = ms('8s');

/** Предел веса кадра ролика, который скачиваем у ВК (байт). */
export const VK_COVER_MAX_BYTES = 10 * 1024 * 1024;

/** Тип кадра, если ВК его не назвал. */
export const VK_COVER_FALLBACK_TYPE = 'image/jpeg';

/** Метка записей в логе. */
export const VK_VIDEO_LOG = '[VK Video]';
