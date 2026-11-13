import type {
  CommunityNewsAdminTab,
  CommunityNewsPublishMode,
  CommunityNewsPubState,
  CommunityNewsStatus,
} from './types';

import { Role } from '~/shared/types';

/**
 * Базовый путь API новостей сообщества. Отдельный от новостей сайта: у
 * инструмента свои права, и его можно будет вынести в отдельный сервис,
 * поменяв один этот путь.
 */
export const COMMUNITY_NEWS_API_PATH = '/api/v2/community-news';

/** Путь последних опубликованных новостей сообщества. */
export const COMMUNITY_NEWS_SEARCH_PATH = `${COMMUNITY_NEWS_API_PATH}/search`;

/** Путь черновиков, снятых и запланированных новостей (для публикующих). */
export const COMMUNITY_NEWS_UNPUBLISHED_SEARCH_PATH = `${COMMUNITY_NEWS_API_PATH}/search/unpublished`;

/** Путь предпросмотра несохранённой новости. */
export const COMMUNITY_NEWS_PREVIEW_PATH = `${COMMUNITY_NEWS_API_PATH}/preview`;

/**
 * Роли, которым открыт инструмент публикации. Сейчас это админ и модератор;
 * когда появится отдельная роль ведущих новостей сообщества, её добавляют
 * сюда (страницы и кнопки читают права только отсюда и из
 * `canPublishCommunityNews`).
 */
export const COMMUNITY_NEWS_EDITOR_ROLES: ReadonlyArray<Role> = [
  Role.ADMIN,
  Role.MODERATOR,
];

/** Публичный маршрут листинга (и база маршрута чтения). */
export const COMMUNITY_NEWS_ROUTE = '/community-news';

/**
 * Маршрут инструмента публикации. Пока живёт в админ-панели; при переезде
 * (например, в панель модератора) меняются только маршруты здесь и страницы.
 */
export const COMMUNITY_NEWS_ADMIN_ROUTE = '/admin/community-news';

/** Маршрут создания новости сообщества. */
export const COMMUNITY_NEWS_ADMIN_CREATE_ROUTE = `${COMMUNITY_NEWS_ADMIN_ROUTE}/create`;

/** Название раздела (листинг, меню). */
export const COMMUNITY_NEWS_TITLE = 'Новости сообщества';

/** Название инструмента публикации (админка). */
export const COMMUNITY_NEWS_ADMIN_TITLE = 'Новости сообщества';

/** Иконка раздела. */
export const COMMUNITY_NEWS_ICON = 'tabler:users-group';

/** Описание листинга для поисковиков. */
export const COMMUNITY_NEWS_SEO_DESCRIPTION =
  'Новости сообщества TTG Club: игры, клубы, видео и события от игроков и мастеров D&D 5.';

/** Количество записей в публичном листинге (шаг «Показать ещё»). */
export const COMMUNITY_NEWS_LIST_COUNT = 24;

/** Пауза перед серверным поиском, пока человек печатает, мс. */
export const COMMUNITY_NEWS_SEARCH_DEBOUNCE = 300;

/** Количество записей в списке инструмента публикации. */
export const COMMUNITY_NEWS_ADMIN_LIST_COUNT = 100;

/** Формат даты публикации для карточек и страницы чтения. */
export const COMMUNITY_NEWS_DATE_FORMAT = 'LL';

/** Формат даты и времени для списка в инструменте публикации. */
export const COMMUNITY_NEWS_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

/** Раздел (префикс) для загрузки обложек в хранилище S3. */
export const COMMUNITY_NEWS_IMAGE_SECTION = 'community-news';

/** Максимальная длинная сторона обложки, px. */
export const COMMUNITY_NEWS_IMAGE_MAX_SIZE = '1024';

/** Заглушка обложки, если нет ни картинки, ни превью ролика. */
export const COMMUNITY_NEWS_FALLBACK_IMAGE = '/img/no-img.webp';

/** Подпись ссылки на первоисточник. */
/** Подпись кнопки на обложке новости: открыть её на отдельной странице. */
export const COMMUNITY_NEWS_OPEN_PAGE_LABEL = 'Открыть на отдельной странице';

export const COMMUNITY_NEWS_SOURCE_LABEL = 'Первоисточник';

/** Подпись поля автора в редакторе. */
export const COMMUNITY_NEWS_AUTHOR_LABEL = 'Автор или сообщество';

/** Подсказка поля автора в редакторе. */
export const COMMUNITY_NEWS_AUTHOR_HINT =
  'Чья это новость: мастер, клуб, канал. Показывается на карточке.';

/** Подпись поля первоисточника в редакторе. */
export const COMMUNITY_NEWS_SOURCE_URL_LABEL = 'Ссылка на первоисточник';

/** Подсказка поля первоисточника в редакторе. */
export const COMMUNITY_NEWS_SOURCE_URL_HINT =
  'Пост, канал или страница клуба — откроется кнопкой «Первоисточник».';

/** Длина описания страницы для поисковиков, символов. */
export const COMMUNITY_NEWS_SEO_DESCRIPTION_LENGTH = 160;

/** Сколько карточек-скелетонов показывать, пока грузится список. */
export const COMMUNITY_NEWS_SKELETON_COUNT = 6;

/** Тексты публичного листинга. */
export const COMMUNITY_NEWS_LISTING_TEXT = {
  loadMore: 'Показать ещё',
  emptyDetailTitle: 'Новость не выбрана',
  emptyDetailDescription:
    'Выберите новость из списка, чтобы прочитать её здесь.',
} as const;

/** Подпись кнопки «открыть в панели» на карточке листинга. */
export function getCommunityNewsOpenInPanelLabel(title: string): string {
  return `Открыть «${title}» в панели`;
}

/** Тексты страницы чтения и её заголовков. */
export const COMMUNITY_NEWS_PAGE_TEXT = {
  notFound: 'Новость не найдена',
  createTitle: 'Новость сообщества',
  editTitle: 'Правка новости сообщества',
  close: 'Закрыть',
} as const;

/** Тексты редактора новости сообщества. */
export const COMMUNITY_NEWS_EDITOR_TEXT = {
  mainSection: 'Основная информация',
  mediaSection: 'Обложка и видео',
  contentSection: 'Текст новости',
  titleLabel: 'Заголовок',
  titlePlaceholder: 'Введи заголовок',
  urlLabel: 'URL',
  authorPlaceholder: 'Например: клуб «Таверна»',
  sourceUrlPlaceholder: 'https://…',
  accessibleByLinkLabel: 'Доступна по ссылке',
  accessibleByLinkDescription:
    'Снятую новость можно открыть по прямой ссылке — для предпросмотра. В списках её нет.',
  copyPreviewLink: 'Скопировать ссылку для предпросмотра',
  contentPlaceholder: 'Полный текст новости',
  removeCover: 'Удалить обложку',
  noCoverAlt: 'Обложки нет',
  close: 'Закрыть',
  preview: 'Предпросмотр',
  saveDraft: 'Сохранить черновик',
  save: 'Сохранить',
  publish: 'Опубликовать',
  schedule: 'Запланировать',
  coverUploadingTitle: 'Обложка ещё загружается',
  coverUploadingDescription:
    'Дождись окончания загрузки картинки и сохрани ещё раз.',
  wrongDateTitle: 'Проверь дату публикации',
  wrongDateDescription:
    'Для отложенной публикации укажи дату и время в будущем.',
} as const;

/** Тексты списка в инструменте публикации. */
export const COMMUNITY_NEWS_ADMIN_TEXT = {
  searchPlaceholder: 'Поиск по заголовку',
  clearSearch: 'Очистить',
  openSite: 'На сайте',
  create: 'Создать',
  loadError: 'Не удалось загрузить новости',
  retry: 'Повторить',
  deleteTitle: 'Скрыть новость?',
  deleteDescription:
    'Новость пропадёт из публичных списков и со страницы чтения, но не удалится физически.',
  cancel: 'Отмена',
  hide: 'Скрыть',
  edit: 'Редактировать',
  hideNews: 'Скрыть новость',
  accessibleByLink: 'Доступна по прямой ссылке',
  activeTooltip: 'Активна — снять с публикации',
  inactiveTooltip: 'Неактивна — сделать активной',
  deactivate: 'Снять с публикации',
  activate: 'Сделать активной',
  emptyDate: '—',
} as const;

/** Уведомления действий в инструменте публикации. */
export const COMMUNITY_NEWS_ADMIN_TOASTS = {
  hiddenTitle: 'Новость скрыта',
  hiddenDescription: 'Новость убрана из публичных списков',
  hideFailed: 'Не удалось скрыть новость',
  activatedTitle: 'Снова активна',
  activatedDescription: 'Новость снова на сайте',
  deactivatedTitle: 'Снята с публикации',
  deactivatedDescription: 'Новость убрана с сайта, но осталась опубликованной',
  toggleFailed: 'Не удалось изменить активность новости',
  errorTitle: 'Ошибка',
} as const;

/** Пустой поиск. */
export function getCommunityNewsSearchEmptyText(search: string): string {
  return `По запросу «${search}» ничего не найдено`;
}

/** Вкладки списка в инструменте публикации. */
export const COMMUNITY_NEWS_ADMIN_TABS: Array<{
  label: string;
  value: CommunityNewsAdminTab;
}> = [
  { label: 'Опубликованные', value: 'published' },
  { label: 'Неопубликованные', value: 'unpublished' },
  { label: 'Черновики', value: 'draft' },
];

/**
 * Статусы записей для каждой вкладки: `/search/unpublished` отдаёт общий
 * набор, «Неопубликованные» и «Черновики» делим по `status` на клиенте.
 * `null` — без фильтра (`/search` и так отдаёт ровно опубликованные).
 */
export const COMMUNITY_NEWS_ADMIN_TAB_STATUSES: Record<
  CommunityNewsAdminTab,
  ReadonlyArray<CommunityNewsStatus> | null
> = {
  published: null,
  unpublished: ['INACTIVE', 'SCHEDULED'],
  draft: ['DRAFT'],
};

/** Пустые вкладки списка в инструменте публикации. */
export const COMMUNITY_NEWS_ADMIN_EMPTY_TEXTS: Record<
  CommunityNewsAdminTab,
  string
> = {
  published: 'Опубликованных новостей нет — создайте первую',
  unpublished: 'Неопубликованных новостей нет',
  draft: 'Черновиков пока нет',
};

/** Цвета бейджей статусов (семантические цвета Nuxt UI). */
export const COMMUNITY_NEWS_STATUS_COLORS = {
  DRAFT: 'neutral',
  SCHEDULED: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'error',
} as const satisfies Record<CommunityNewsStatus, string>;

/** Опции выбора состояния публикации в редакторе. */
export const COMMUNITY_NEWS_PUB_STATE_OPTIONS: Array<{
  label: string;
  value: CommunityNewsPubState;
}> = [
  { label: 'Активна', value: 'active' },
  { label: 'Неактивна', value: 'inactive' },
  { label: 'Черновик', value: 'draft' },
];

/** Режимы публикации в редакторе. */
export const COMMUNITY_NEWS_PUBLISH_MODES: Array<{
  label: string;
  value: CommunityNewsPublishMode;
}> = [
  { label: 'Опубликовать сейчас', value: 'now' },
  { label: 'Запланировать', value: 'schedule' },
];

/** Публичный маршрут чтения новости сообщества. */
export function getCommunityNewsRoute(url: string): string {
  return `${COMMUNITY_NEWS_ROUTE}/${url}`;
}

/** Маршрут правки новости сообщества в инструменте публикации. */
export function getCommunityNewsEditRoute(url: string): string {
  return `${COMMUNITY_NEWS_ADMIN_ROUTE}/${url}`;
}
