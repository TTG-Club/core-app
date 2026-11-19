/**
 * Общий контракт раздела «Документация VTTG»: каналы, роуты и пределы
 * настройки. Нужен и серверу (чтение канала обновлений, проверка доступа), и
 * клиенту (страницы раздела, форма в админке).
 */

/**
 * Каналы документации. `release` выкладывается из ветки `main` репозитория
 * VTTG и открыт всем, `dev` — из ветки `dev` и виден только ролям из
 * настройки в админке.
 */
export const VTTG_DOCS_CHANNELS = ['release', 'dev'] as const;

export type VttgDocsChannel = (typeof VTTG_DOCS_CHANNELS)[number];

/** Канал по умолчанию — тот, что видят все. */
export const VTTG_DOCS_DEFAULT_CHANNEL: VttgDocsChannel = 'release';

/** Канал ветки разработки — виден только ролям из настройки в админке. */
export const VTTG_DOCS_DEV_CHANNEL: VttgDocsChannel = 'dev';

/** Публичный роут оглавления канала: `/api/vttg/docs?channel=dev`. */
export const VTTG_DOCS_API_PATH = '/api/vttg/docs';

/**
 * Публичный роут страницы: `/api/vttg/docs/pages/<group>/<page>?channel=dev`.
 */
export const VTTG_DOCS_PAGES_API_PATH = '/api/vttg/docs/pages';

/** Роут админки: чтение (`GET`) и сохранение (`PUT`) настройки раздела. */
export const VTTG_DOCS_ADMIN_API_PATH = '/api/admin/vttg-docs';

/** Корень раздела на сайте. */
export const VTTG_DOCS_ROUTE = '/vttg/docs';

/**
 * Тело slug группы и страницы без якорей начала и конца строки: латиница в
 * нижнем регистре, цифры и дефис. Из него же собирается разбор пути файла
 * страницы на сервере.
 */
export const VTTG_DOCS_SLUG_SOURCE = '[a-z0-9][a-z0-9-]*';

/** Slug группы и страницы целиком. */
export const VTTG_DOCS_SLUG_PATTERN = new RegExp(`^${VTTG_DOCS_SLUG_SOURCE}$`);

/** Сколько ролей можно пустить в dev-канал. */
export const VTTG_DOCS_DEV_ROLES_MAX_COUNT = 20;

/** Самое длинное имя роли, которое принимает форма. */
export const VTTG_DOCS_ROLE_MAX_LENGTH = 50;

/** Имя роли как в токене: заглавные латинские буквы, цифры и `_`. */
export const VTTG_DOCS_ROLE_PATTERN = /^[A-Z][A-Z0-9_]*$/;
