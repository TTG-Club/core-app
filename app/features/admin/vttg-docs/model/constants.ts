import {
  VTTG_DOCS_DEFAULT_CHANNEL,
  VTTG_DOCS_DEV_CHANNEL,
} from '#shared/consts';
import { getVttgDocsIndexRoute } from '#shared/utils';
import {
  VTTG_DOCS_CHANNEL_ICONS,
  VTTG_DOCS_ICON,
  VTTG_DOCS_RETRY_LABEL,
  VTTG_DOCS_TITLE,
} from '~vttg-docs/model';

/** Страница настройки документации VTTG в админке. */
export const VTTG_DOCS_ADMIN_ROUTE = '/admin/vttg-docs';

export const VTTG_DOCS_ADMIN_DATA_KEY = 'admin-vttg-docs-settings';

/** Форма до загрузки настройки — как настройка по умолчанию на сервере. */
export const VTTG_DOCS_ADMIN_EMPTY_FORM: VttgDocsSettingsUpdate = {
  isReleaseChannelPublic: true,
  releaseChannelRoles: [],
  devChannelRoles: [],
};

export const VTTG_DOCS_ADMIN_PAGE_TITLE = VTTG_DOCS_TITLE;

export const VTTG_DOCS_ADMIN_SEO_TITLE = `${VTTG_DOCS_ADMIN_PAGE_TITLE}: Настройки`;

export const VTTG_DOCS_ADMIN_NAVIGATION_ICON = VTTG_DOCS_ICON;

export const VTTG_DOCS_ADMIN_PAGE_HINT =
  'Документацию выкладывает сам VTTG при каждой сборке: из ветки main — в релизный канал, из ветки dev — в канал разработки. Здесь настраивается, кому на сайте виден каждый канал. Администраторы видят оба всегда; кому не виден ни один канал, у того нет и пункта «Документация» в меню.';

export const VTTG_DOCS_ADMIN_RELEASE_PUBLIC_LABEL =
  'Релизный канал открыт всем';

export const VTTG_DOCS_ADMIN_RELEASE_PUBLIC_HINT =
  'Его видят все, в том числе без входа, и поисковики. Выключите, чтобы открыть его только выбранным ролям.';

export const VTTG_DOCS_ADMIN_RELEASE_ROLES_LABEL = 'Кому виден релизный канал';

export const VTTG_DOCS_ADMIN_DEV_ROLES_LABEL = 'Кому виден канал разработки';

/** Подсказка к выбору ролей — одна у обоих каналов. */
export const VTTG_DOCS_ADMIN_ROLES_HINT =
  'Роли, которой нет в списке, впишите её имя из core-api латиницей (например, TESTER) и нажмите Enter.';

export const VTTG_DOCS_ADMIN_ROLES_PLACEHOLDER = 'Только администраторы';

export const VTTG_DOCS_ADMIN_OPEN_LABEL = 'Открыть документацию';

export const VTTG_DOCS_ADMIN_OPEN_DEV_LABEL = 'Канал разработки';

/** Иконки ссылок на каналы — те же, что в переключателе раздела. */
export const VTTG_DOCS_ADMIN_OPEN_ICON =
  VTTG_DOCS_CHANNEL_ICONS[VTTG_DOCS_DEFAULT_CHANNEL];

export const VTTG_DOCS_ADMIN_OPEN_DEV_ICON =
  VTTG_DOCS_CHANNEL_ICONS[VTTG_DOCS_DEV_CHANNEL];

/** Ссылка на оглавление релизного канала. */
export const VTTG_DOCS_ADMIN_RELEASE_CHANNEL_LINK = getVttgDocsIndexRoute(
  VTTG_DOCS_DEFAULT_CHANNEL,
);

/** Ссылка на оглавление канала разработки. */
export const VTTG_DOCS_ADMIN_DEV_CHANNEL_LINK = getVttgDocsIndexRoute(
  VTTG_DOCS_DEV_CHANNEL,
);

export const VTTG_DOCS_ADMIN_SAVE_LABEL = 'Сохранить';

export const VTTG_DOCS_ADMIN_SAVE_ICON = 'tabler:device-floppy';

export const VTTG_DOCS_ADMIN_SAVE_SUCCESS_MESSAGE = 'Настройка сохранена';

export const VTTG_DOCS_ADMIN_SAVE_ERROR_TITLE =
  'Не удалось сохранить настройку';

export const VTTG_DOCS_ADMIN_LOAD_ERROR_TITLE =
  'Не удалось загрузить настройку';

export const VTTG_DOCS_ADMIN_RETRY_LABEL = VTTG_DOCS_RETRY_LABEL;

export const VTTG_DOCS_ADMIN_NEVER_SAVED_LABEL = 'Ещё не сохранялась';

export const VTTG_DOCS_ADMIN_UPDATED_LABEL = 'Сохранено';

export const VTTG_DOCS_ADMIN_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

/** Разделитель даты сохранения и автора. */
export const VTTG_DOCS_ADMIN_UPDATED_SEPARATOR = ' · ';

/** Иконка заглушки, когда настройка не загрузилась. */
export const VTTG_DOCS_ADMIN_LOAD_ERROR_ICON = 'tabler:alert-triangle';
