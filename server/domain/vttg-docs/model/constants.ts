import type { VttgDocsSettings } from '#shared/types';

import { StatusCodes } from 'http-status-codes';
import ms from 'ms';

import { VTTG_DOCS_SLUG_SOURCE } from '#shared/consts';

/**
 * Сколько Nitro держит оглавление канала (сек). Его `latest.json` сборка VTTG
 * перезаписывает при каждой выкладке, поэтому срок короткий: новая версия доков
 * появляется на сайте сама, без деплоя.
 */
export const VTTG_DOCS_INDEX_CACHE_MAX_AGE_SECONDS = ms('5m') / 1000;

/**
 * Сколько Nitro держит собранную страницу (сек). Папка версии в канале после
 * заливки не меняется, а ключ кеша включает версию — срок ограничивает только
 * память.
 */
export const VTTG_DOCS_PAGE_CACHE_MAX_AGE_SECONDS = ms('1d') / 1000;

/** Таймаут запроса файла канала: файлы маленькие. */
export const VTTG_DOCS_REQUEST_TIMEOUT = ms('10s');

/** Версия VTTG: `0.9.330` или `0.9.330-dev.5a9b3c55` — она же часть пути. */
export const VTTG_DOCS_VERSION_PATTERN = /^[0-9A-Z][0-9A-Z.+-]*$/i;

/** Файл оглавления в папке канала. */
export const VTTG_DOCS_INDEX_FILE = 'latest.json';

/**
 * Статусы, которыми бакет отвечает на ещё не выложенный канал: на
 * отсутствующий ключ он отдаёт 403, а не 404.
 */
export const VTTG_DOCS_MISSING_STATUSES: number[] = [
  StatusCodes.FORBIDDEN,
  StatusCodes.NOT_FOUND,
];

/** Уровни заголовков, которые попадают в оглавление справа. */
export const VTTG_DOCS_TOC_DEPTHS = [2, 3];

/**
 * Настройка, пока админ её не сохранял: релиз открыт всем, канал разработки —
 * только администраторам.
 */
export const VTTG_DOCS_DEFAULT_SETTINGS: VttgDocsSettings = {
  isReleaseChannelPublic: true,
  releaseChannelRoles: [],
  devChannelRoles: [],
  updatedAt: null,
  updatedBy: null,
};

/**
 * Права, когда настройку не удалось прочитать: раздел закрывается всем, кроме
 * администраторов, — иначе сбой хранилища открыл бы закрытый канал.
 */
export const VTTG_DOCS_FALLBACK_SETTINGS: VttgDocsSettings = {
  ...VTTG_DOCS_DEFAULT_SETTINGS,
  isReleaseChannelPublic: false,
};

/** Имя кеша Nitro для оглавления канала. */
export const VTTG_DOCS_INDEX_CACHE_NAME = 'vttg-docs-index';

/** Имя кеша Nitro для собранной страницы. */
export const VTTG_DOCS_PAGE_CACHE_NAME = 'vttg-docs-page';

/**
 * Ключ настройки в хранилище — рядом с настройками шапки главной и режима
 * обновления, в папке `settings`.
 */
export const VTTG_DOCS_SETTINGS_KEY = 'settings/vttg-docs.json';

export const VTTG_DOCS_SETTINGS_FILENAME = 'vttg-docs.json';

export const VTTG_DOCS_SETTINGS_CONTENT_TYPE = 'application/json';

export const VTTG_DOCS_SETTINGS_CACHE_NAME = 'vttg-docs-settings';

export const VTTG_DOCS_SETTINGS_CACHE_KEY = 'settings';

/** Запись кеша Nitro: `nitro:functions`, имя функции и ключ с `.json`. */
export const VTTG_DOCS_SETTINGS_CACHE_STORAGE_KEY = `nitro:functions:${VTTG_DOCS_SETTINGS_CACHE_NAME}:${VTTG_DOCS_SETTINGS_CACHE_KEY}.json`;

/**
 * Сколько Nitro держит настройку (сек). Её читает каждый заход в раздел; на
 * этом экземпляре кеш сбрасывается сразу после сохранения.
 */
export const VTTG_DOCS_SETTINGS_CACHE_MAX_AGE_SECONDS = ms('1m') / 1000;

/** Имя ошибки S3, когда файла настройки ещё нет. */
export const VTTG_DOCS_SETTINGS_MISSING_ERROR = 'NoSuchKey';

/** Ссылки, которые открываются в новой вкладке как есть. */
export const VTTG_DOCS_EXTERNAL_LINK_PATTERN = /^(?:https?:|mailto:)/i;

/** Картинки показываем только с внешних адресов: своих файлов в выкладке нет. */
export const VTTG_DOCS_EXTERNAL_IMAGE_PATTERN = /^https:\/\//i;

/** Начало ссылки на заголовок той же страницы. */
export const VTTG_DOCS_ANCHOR_PREFIX = '#';

/**
 * Условный корень папки документации для разбора относительных ссылок:
 * `../modules/live-reload.md` от `systems/overview.md` даёт
 * `/modules/live-reload.md`. Сам адрес никуда не ведёт.
 */
export const VTTG_DOCS_RELATIVE_LINK_ORIGIN = 'https://vttg-docs.invalid';

export const VTTG_DOCS_RELATIVE_LINK_BASE = `${VTTG_DOCS_RELATIVE_LINK_ORIGIN}/`;

/** Расширение файла страницы. */
export const VTTG_DOCS_PAGE_FILE_EXTENSION = '.md';

/** Файл страницы после разбора ссылки: `/группа/страница.md`. */
export const VTTG_DOCS_PAGE_FILE_PATH_PATTERN = new RegExp(
  `^/(${VTTG_DOCS_SLUG_SOURCE})/(${VTTG_DOCS_SLUG_SOURCE})\\.md$`,
);

/** Обёртка таблицы с горизонтальной прокруткой; стили — у статьи на сайте. */
export const VTTG_DOCS_TABLE_CLASS = 'vttg-docs-table';

/**
 * Метка блока-предупреждения GitHub в первой строке цитаты: `> [!NOTE]`.
 * Метка стоит отдельной строкой, как того требует GitHub.
 */
export const VTTG_DOCS_ALERT_MARKER_PATTERN = /^\[!([A-Z]+)\][ \t]*(?:\n|$)/;

/** Заголовки блоков-предупреждений по виду метки — те же пять видов, что у GitHub. */
export const VTTG_DOCS_ALERT_TITLES: Record<string, string> = {
  NOTE: 'Примечание',
  TIP: 'Совет',
  IMPORTANT: 'Важно',
  WARNING: 'Внимание',
  CAUTION: 'Осторожно',
};

/** Блок-предупреждение; вид добавляется модификатором `--note`, `--tip` и т. д. */
export const VTTG_DOCS_ALERT_CLASS = 'vttg-docs-alert';

/** Заголовок блока-предупреждения. */
export const VTTG_DOCS_ALERT_TITLE_CLASS = 'vttg-docs-alert-title';

/** Атрибуты внешней ссылки: новая вкладка без доступа к сайту. */
export const VTTG_DOCS_EXTERNAL_LINK_ATTRIBUTES =
  ' target="_blank" rel="noopener noreferrer"';

/** Метка ошибок раздела в логе. */
export const VTTG_DOCS_ERROR_LOG = '[VTTG Docs Error]:';

/** Файл настройки не разбирается как JSON или не совпал со схемой. */
export const VTTG_DOCS_SETTINGS_INVALID_LOG =
  '[VTTG Docs] Settings file is broken, defaults are used:';

/** Настройку не удалось прочитать при проверке прав: раздел закрыт. */
export const VTTG_DOCS_SETTINGS_UNAVAILABLE_LOG =
  '[VTTG Docs] Settings are unavailable, docs are closed to non-admins:';

/** Оглавление канала не совпало со схемой. */
export const VTTG_DOCS_INDEX_INVALID_LOG =
  '[VTTG Docs] latest.json has unexpected format:';

/** В конфиге сайта не задан адрес документации в канале обновлений. */
export const VTTG_DOCS_BASE_URL_MISSING_ERROR =
  '[VTTG Docs] Docs base url is not set';

/** `latest.json` не совпал со схемой. */
export const VTTG_DOCS_INDEX_INVALID_ERROR =
  '[VTTG Docs] latest.json has unexpected format';

/** `latest.json` лежит в папке одного канала, а говорит о другом. */
export const VTTG_DOCS_INDEX_CHANNEL_MISMATCH_ERROR =
  '[VTTG Docs] latest.json belongs to another channel';
