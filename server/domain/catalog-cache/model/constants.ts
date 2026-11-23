/**
 * Имя хранилища кэша каталога. Само хранилище (в памяти, с вытеснением давно
 * не читанных ответов и сроком жизни записи) описано в `nitro.storage`
 * в `nuxt.config.ts`.
 */
export const CATALOG_CACHE_STORAGE = 'catalog-cache';

/** Начало адресов core-api, под которым лежат разделы. */
export const CATALOG_API_PREFIX = '/api/v2/';

/**
 * Разделы core-api, ответы которых на чтение одинаковы для всех посетителей и
 * меняются только правкой редактора. Проверено по контроллерам core-api: в
 * чтении этих разделов пользователь запроса не участвует.
 */
export const CATALOG_CACHE_SECTIONS: readonly string[] = [
  'backgrounds',
  'bastions',
  'bestiary',
  'classes',
  'dictionaries',
  'feats',
  'glossary',
  'items',
  'magic-items',
  'multiclass',
  'source',
  'species',
  'spells',
];

/** Метод, которым читают каталог. */
export const CATALOG_READ_METHOD = 'GET';

/** Методы, которые каталог заведомо не меняют. */
export const CATALOG_SAFE_METHODS: readonly string[] = ['GET', 'HEAD'];

/**
 * Последний кусок адреса формы редактора (`/spells/fireball/raw`). Форма нужна
 * только редактору и обязана быть свежей, поэтому в кэш не попадает.
 */
export const CATALOG_EDITOR_FORM_SEGMENT = 'raw';

/**
 * Последние куски адресов, которые шлют тело запроса, но каталог не меняют:
 * предпросмотр формы и поиск источников.
 */
export const CATALOG_READ_ONLY_ACTION_SEGMENTS: readonly string[] = [
  'preview',
  'search',
];

/**
 * Разделы core-api, запись в которые меняет каталог, хотя сами они в кэш не
 * попадают: откат записи к прежней версии.
 */
export const CATALOG_CACHE_RESET_SECTIONS: readonly string[] = ['revisions'];

/**
 * Адрес сброса кэша самого core-api (кнопка администратора на главной). Вместе
 * с ним сбрасывается и кэш каталога на сервере сайта.
 */
export const CATALOG_CACHE_RESET_PATH = '/api/v2/cache/evict-all';

/** Заголовок ответа: взят ли ответ из кэша. Нужен для проверки и отладки. */
export const CATALOG_CACHE_STATE_HEADER = 'x-catalog-cache';

/** Заголовок типа содержимого. */
export const CATALOG_CONTENT_TYPE_HEADER = 'content-type';

/** Тип содержимого, если core-api его не прислал. */
export const CATALOG_DEFAULT_CONTENT_TYPE = 'application/json';

/**
 * Заголовки посетителя, которые в запрос за общим ответом не передаются:
 * ответ обязан быть таким, каким его видит гость.
 */
export const CATALOG_PERSONAL_HEADERS: readonly string[] = [
  'authorization',
  'cookie',
];

/**
 * Заголовки, которые относятся к соединению посетителя с сайтом, а не к
 * запросу, и дальше не передаются (тот же список, что у прокси h3). Без
 * `accept-encoding` сжатие ответа выбирает сам сервер сайта. Условные
 * заголовки убраны, чтобы core-api всегда присылал ответ целиком: пустой
 * ответ «не изменилось» в общий кэш класть нельзя.
 */
export const CATALOG_HOP_HEADERS: readonly string[] = [
  'accept',
  'accept-encoding',
  'connection',
  'expect',
  'host',
  'if-modified-since',
  'if-none-match',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
];

/** Первый код ответа, который считается ошибкой. */
export const CATALOG_FIRST_ERROR_STATUS = 400;
