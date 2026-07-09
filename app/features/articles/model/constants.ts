import type {
  ArticleAdminTab,
  ArticlePublishMode,
  ArticlePubState,
  ArticleStatus,
  ArticleType,
  ArticleTypeFilter,
} from './types';

/** Базовый путь API записей (статьи/новости). */
export const ARTICLES_API_PATH = '/api/v2/articles';

/** Путь поиска последних опубликованных записей. */
export const ARTICLES_SEARCH_PATH = `${ARTICLES_API_PATH}/search`;

/** Путь поиска черновиков и отложенных записей (для модерации). */
export const ARTICLES_UNPUBLISHED_SEARCH_PATH = `${ARTICLES_API_PATH}/search/unpublished`;

/** Публичный маршрут листинга статей (и база маршрута чтения `/articles/{url}`). */
export const ARTICLES_ROUTE = '/articles';

/** Публичный маршрут листинга новостей. */
export const NEWS_ROUTE = '/news';

/** Маршрут раздела управления в админ-панели. */
export const ARTICLES_ADMIN_ROUTE = '/admin/articles';

/** Маршрут создания новой записи. */
export const ARTICLES_ADMIN_CREATE_ROUTE = `${ARTICLES_ADMIN_ROUTE}/create`;

/** Вкладки списка в админ-панели (опубликованные / неопубликованные / черновики). */
export const ARTICLE_ADMIN_TABS: Array<{
  label: string;
  value: ArticleAdminTab;
}> = [
  { label: 'Опубликованные', value: 'published' },
  { label: 'Неопубликованные', value: 'unpublished' },
  { label: 'Черновики', value: 'draft' },
];

/**
 * Статусы записей для каждой вкладки админ-списка. `/search/unpublished` отдаёт
 * общий набор (черновики + снятые + запланированные), поэтому вкладки
 * «Неопубликованные» и «Черновики» разделяем по `status` на клиенте. `null` =
 * без фильтра: `/search` уже возвращает ровно опубликованные (активные).
 */
export const ARTICLE_ADMIN_TAB_STATUSES: Record<
  ArticleAdminTab,
  readonly ArticleStatus[] | null
> = {
  published: null,
  unpublished: ['INACTIVE', 'SCHEDULED'],
  draft: ['DRAFT'],
};

/** Опции фильтра по типу записи. */
export const ARTICLE_TYPE_FILTER_OPTIONS: Array<{
  label: string;
  value: ArticleTypeFilter;
}> = [
  { label: 'Все типы', value: 'all' },
  { label: 'Новости', value: 'NEWS' },
  { label: 'Статьи', value: 'ARTICLE' },
];

/** Ключи типов записей. */
export const ARTICLE_TYPE = {
  NEWS: 'NEWS',
  ARTICLE: 'ARTICLE',
} as const satisfies Record<string, ArticleType>;

/** Тип записи по умолчанию при создании. */
export const ARTICLE_TYPE_DEFAULT: ArticleType = ARTICLE_TYPE.NEWS;

/** Человекочитаемые названия типов (fallback, если нет `typeName` из API). */
const ARTICLE_TYPE_LABELS = {
  NEWS: 'Новость',
  ARTICLE: 'Статья',
} as const satisfies Record<ArticleType, string>;

/** Опции типа для тумблера в редакторе. */
export const ARTICLE_TYPE_OPTIONS: Array<{
  label: string;
  value: ArticleType;
}> = [
  { label: ARTICLE_TYPE_LABELS.NEWS, value: ARTICLE_TYPE.NEWS },
  { label: ARTICLE_TYPE_LABELS.ARTICLE, value: ARTICLE_TYPE.ARTICLE },
];

/** Цвета бейджей статусов (семантические цвета Nuxt UI). */
export const ARTICLE_STATUS_COLORS = {
  DRAFT: 'neutral',
  SCHEDULED: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'error',
} as const satisfies Record<ArticleStatus, string>;

/** Опции сегментированного выбора состояния публикации в редакторе. */
export const ARTICLE_PUB_STATE_OPTIONS: Array<{
  label: string;
  value: ArticlePubState;
}> = [
  { label: 'Активна', value: 'active' },
  { label: 'Неактивна', value: 'inactive' },
  { label: 'Черновик', value: 'draft' },
];

/** Режимы публикации в редакторе (тумблер). */
export const ARTICLE_PUBLISH_MODES: Array<{
  label: string;
  value: ArticlePublishMode;
}> = [
  { label: 'Опубликовать сейчас', value: 'now' },
  { label: 'Запланировать', value: 'schedule' },
];

/** Формат даты публикации для карточек и страницы чтения. */
export const ARTICLE_DATE_FORMAT = 'LL';

/** Формат даты и времени для списка в админ-панели. */
export const ARTICLE_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

/** Раздел (префикс) для загрузки обложек в хранилище S3. */
export const ARTICLE_IMAGE_SECTION = 'articles';

/** Максимальная длинная сторона обложки, px. */
export const ARTICLE_IMAGE_MAX_SIZE = '1024';

/** Заглушка обложки, если `previewImageUrl` отсутствует. */
export const ARTICLE_FALLBACK_IMAGE = '/img/no-img.webp';

/** Количество записей в публичном листинге. */
export const ARTICLES_LIST_COUNT = 24;

/** Количество записей, загружаемых в списке админ-панели. */
export const ARTICLES_ADMIN_LIST_COUNT = 100;

/** Количество новостей в блоке на главной (1 «геройская» + сетка из 4). */
export const HOME_NEWS_COUNT = 5;

/**
 * Желательный максимум символов поста (анонс + содержание) для кросс-постинга в
 * соцсети. НЕ жёсткий лимит — только подсказка в редакторе, отправку не блокирует.
 * Зависит от обложки: текстовый пост длиннее, подпись к картинке — короче.
 */
export const ARTICLE_POST_CHAR_TARGET_NO_IMAGE = 4000;
export const ARTICLE_POST_CHAR_TARGET_WITH_IMAGE = 1000;

/**
 * Возвращает публичный маршрут чтения записи по её `url` (общий для новостей и
 * статей — на бэке один эндпоинт `GET /articles/{url}`).
 */
export function getArticleRoute(url: string): string {
  return `${ARTICLES_ROUTE}/${url}`;
}
