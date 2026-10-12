import type { ListPresentationConfig } from '~infrastructure/list-presentation/model';
import type { RatingValue } from '~ui/rating';

import type {
  ArticleAdminTab,
  ArticleDiscordMention,
  ArticleGrouping,
  ArticlePublishChannel,
  ArticlePublishMode,
  ArticlePubState,
  ArticleShortResponse,
  ArticleSorting,
  ArticleStatus,
  ArticleTelegramFormat,
  ArticleType,
  ArticleTypeFilter,
} from './types';

/** Базовый путь API записей (статьи/новости). */
export const ARTICLES_API_PATH = '/api/v2/articles';

/** Путь поиска последних опубликованных записей. */
export const ARTICLES_SEARCH_PATH = `${ARTICLES_API_PATH}/search`;

/** Путь поиска черновиков и отложенных записей (для модерации). */
export const ARTICLES_UNPUBLISHED_SEARCH_PATH = `${ARTICLES_API_PATH}/search/unpublished`;

/** Путь списка тегов опубликованных записей (фильтр листинга и подсказки редактора). */
export const ARTICLES_TAGS_PATH = `${ARTICLES_API_PATH}/tags`;

/** Раздел общей таблицы рейтинга для записей (тот же ключ у бэка). */
export const ARTICLE_RATING_SECTION = 'articles';

/** Заголовок блока содержания статьи. */
export const ARTICLE_TOC_TITLE = 'На этой странице';

/** Сортировка листинга по умолчанию — по дате выхода, новые сверху. */
export const ARTICLE_SORTING_DEFAULT: ArticleSorting = 'DATE';

/**
 * Представление публичного листинга статей для общего меню сортировки
 * (`useListPresentationMenus`). Группировки нет — единственный вариант `NONE`,
 * поэтому в меню попадает только сортировка.
 */
export const ARTICLE_LIST_PRESENTATION: ListPresentationConfig<
  ArticleShortResponse,
  ArticleGrouping,
  ArticleSorting
> = {
  sectionKey: 'articles',
  defaultGrouping: 'NONE',
  defaultSorting: ARTICLE_SORTING_DEFAULT,
  groupingOptions: [
    { label: 'Без группировки', value: 'NONE', apiValue: 'NONE' },
  ],
  sortingOptions: [
    { label: 'По дате выхода', value: 'DATE', apiValue: 'DATE' },
    { label: 'По названию', value: 'TITLE', apiValue: 'TITLE' },
    { label: 'По рейтингу', value: 'RATING', apiValue: 'RATING' },
  ],
};

/** Подпись и плейсхолдер фильтра по тегам в листинге. */
export const ARTICLE_TAGS_FILTER_PLACEHOLDER = 'Теги';

/** Пустой результат листинга, когда записи отсеял только фильтр по тегам. */
export const ARTICLE_TAGS_EMPTY_TEXT = 'По выбранным тегам ничего не найдено';

/** Подпись поля тегов в редакторе. */
export const ARTICLE_TAGS_LABEL = 'Теги';

/** Подсказка поля тегов в редакторе. */
export const ARTICLE_TAGS_HINT =
  'Например: лор, механика, местность. Можно выбрать из уже существующих или добавить новый.';

/** Плейсхолдер поля тегов в редакторе. */
export const ARTICLE_TAGS_PLACEHOLDER = 'Выбери или добавь теги';

/** Максимальная длина тега (длина колонки на бэке). */
export const ARTICLE_TAG_MAX_LENGTH = 64;

/** Публичный маршрут листинга статей (и база маршрута чтения `/articles/{url}`). */
export const ARTICLES_ROUTE = '/articles';

/** Публичный маршрут листинга новостей. */
export const NEWS_ROUTE = '/news';

/** Маршрут раздела управления в админ-панели. */
export const ARTICLES_ADMIN_ROUTE = '/admin/articles';

/** Маршрут создания новой записи. */
export const ARTICLES_ADMIN_CREATE_ROUTE = `${ARTICLES_ADMIN_ROUTE}/create`;

/** Маршрут админ-списка, сразу отфильтрованного по новостям. */
export const ARTICLES_ADMIN_NEWS_ROUTE = `${ARTICLES_ADMIN_ROUTE}?type=NEWS`;

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

/**
 * Каналы кросс-постинга для кнопок-тумблеров в редакторе: ключ флага в
 * `ArticleRequest`, подпись кнопки и иконка (локальная коллекция `ttg`). Порядок
 * = порядок кнопок. Добавление нового канала — одна строка здесь.
 */
export const ARTICLE_PUBLISH_CHANNELS: ReadonlyArray<{
  key: ArticlePublishChannel;
  label: string;
  icon: string;
}> = [
  { key: 'publishToTelegram', label: 'Telegram', icon: 'ttg:telegram' },
  { key: 'publishToDiscord', label: 'Discord', icon: 'ttg:discord' },
  { key: 'publishToVk', label: 'ВКонтакте', icon: 'ttg:vk' },
];

/**
 * Варианты пинга в Discord-канале — единый источник и для схемы формы, и для
 * тумблера в редакторе. Пинг уходит первой строкой поста и только в первом
 * сообщении; подписчикам других серверов он не передаётся — Discord вырезает
 * упоминания из копии.
 */
export const ARTICLE_DISCORD_MENTIONS: readonly ArticleDiscordMention[] = [
  'NONE',
  'EVERYONE',
  'SERVER',
] as const;

/** Подписи вариантов пинга. */
const ARTICLE_DISCORD_MENTION_LABELS = {
  NONE: 'Без пинга',
  EVERYONE: '@everyone',
  SERVER: '@server',
} as const satisfies Record<ArticleDiscordMention, string>;

/** Опции сегментированного выбора пинга в редакторе. */
export const ARTICLE_DISCORD_MENTION_OPTIONS: Array<{
  label: string;
  value: ArticleDiscordMention;
}> = ARTICLE_DISCORD_MENTIONS.map((mention) => ({
  label: ARTICLE_DISCORD_MENTION_LABELS[mention],
  value: mention,
}));

/** Пинг по умолчанию при создании записи — не звеним, пока не попросили. */
export const ARTICLE_DISCORD_MENTION_DEFAULT: ArticleDiscordMention = 'NONE';

/**
 * Варианты вида поста в Telegram — единый источник и для схемы формы, и для тумблера
 * в редакторе. Учитываются только вместе с `publishToTelegram`.
 */
export const ARTICLE_TELEGRAM_FORMATS: readonly ArticleTelegramFormat[] = [
  'INSTANT_VIEW',
  'FULL_TEXT',
] as const;

/** Подписи вариантов вида поста. */
const ARTICLE_TELEGRAM_FORMAT_LABELS = {
  INSTANT_VIEW: 'Instant View',
  FULL_TEXT: 'Полный текст',
} as const satisfies Record<ArticleTelegramFormat, string>;

/** Опции сегментированного выбора вида поста в редакторе. */
export const ARTICLE_TELEGRAM_FORMAT_OPTIONS: Array<{
  label: string;
  value: ArticleTelegramFormat;
}> = ARTICLE_TELEGRAM_FORMATS.map((format) => ({
  label: ARTICLE_TELEGRAM_FORMAT_LABELS[format],
  value: format,
}));

/** Вид поста по умолчанию при создании записи — карточка Instant View. */
export const ARTICLE_TELEGRAM_FORMAT_DEFAULT: ArticleTelegramFormat =
  'INSTANT_VIEW';

/**
 * Желательный максимум символов короткой выжимки под карточкой Instant View —
 * пара-тройка предложений о главном. Мягкая подсказка в редакторе: отправку не
 * блокирует, жёсткий предел — лимит сообщения Telegram (4096).
 */
export const ARTICLE_TELEGRAM_SUMMARY_TARGET = 600;

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

/** Подпись кнопки на обложке новости: открыть запись на отдельной странице. */
export const ARTICLE_OPEN_PAGE_LABEL = 'Открыть на отдельной странице';

/** Подпись кнопки на обложке новости: создать новость (только админу). */
export const ARTICLE_CREATE_NEWS_LABEL = 'Создать новость';

/** Подпись кнопки на обложке новости: список новостей в админ-панели. */
export const ARTICLE_ADMIN_NEWS_LIST_LABEL = 'Список новостей в админ-панели';

/** Количество записей в публичном листинге. */
export const ARTICLES_LIST_COUNT = 24;

/** Количество записей, загружаемых в списке админ-панели. */
export const ARTICLES_ADMIN_LIST_COUNT = 100;

/** Количество новостей в блоке на главной (1 «геройская» + лента из 4). */
export const HOME_NEWS_COUNT = 5;

/** Количество статей в блоке на главной (сетка в две колонки — три ровных ряда). */
export const HOME_ARTICLES_COUNT = 6;

/**
 * Желательный максимум символов поста (анонс + содержание) для кросс-постинга в
 * Telegram. НЕ жёсткий лимит — только подсказка в редакторе, отправку не блокирует.
 * Зависит от обложки: текстовый пост длиннее, подпись к картинке — короче.
 */
export const ARTICLE_POST_CHAR_TARGET_NO_IMAGE = 4000;
export const ARTICLE_POST_CHAR_TARGET_WITH_IMAGE = 1000;

/**
 * Желательный максимум символов поста для Discord — единый при любом раскладе
 * (не зависит от обложки). Тоже мягкая подсказка, отправку не блокирует.
 */
export const ARTICLE_POST_CHAR_TARGET_DISCORD = 1100;

/**
 * Возвращает публичный маршрут чтения записи по её `url` (общий для новостей и
 * статей — на бэке один эндпоинт `GET /articles/{url}`).
 */
export function getArticleRoute(url: string): string {
  return `${ARTICLES_ROUTE}/${url}`;
}

/**
 * Возвращает текст пустого результата листинга для поискового запроса `search`.
 */
export function getArticleSearchEmptyText(search: string): string {
  return `По запросу «${search}» ничего не найдено`;
}

/**
 * Возвращает короткую подпись рейтинга для карточки: средняя оценка и число оценок.
 */
export function getArticleRatingLabel(rating: RatingValue): string {
  return `★ ${rating.value} (${rating.total})`;
}

/**
 * Приводит тег к виду, в котором его хранит бэк: без лишних пробелов, в нижнем
 * регистре, не длиннее `ARTICLE_TAG_MAX_LENGTH`.
 */
export function normalizeArticleTag(tag: string): string {
  return tag
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .slice(0, ARTICLE_TAG_MAX_LENGTH)
    .trim();
}
