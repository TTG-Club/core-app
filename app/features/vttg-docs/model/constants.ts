import type { VttgDocsChannel } from '#shared/consts';

export const VTTG_DOCS_TITLE = 'Документация VTTG';

export const VTTG_DOCS_DESCRIPTION =
  'Как устроен VTTG и как написать для него игровую систему или модуль: API приложения, контракты и примеры.';

/** Подписи каналов в переключателе. */
export const VTTG_DOCS_CHANNEL_LABELS: Record<VttgDocsChannel, string> = {
  release: 'Релиз',
  dev: 'Разработка',
};

/** Иконки каналов в переключателе. */
export const VTTG_DOCS_CHANNEL_ICONS: Record<VttgDocsChannel, string> = {
  release: 'tabler:book',
  dev: 'tabler:flask',
};

/** Иконка подсказки над доками dev-канала — та же, что у канала. */
export const VTTG_DOCS_DEV_NOTICE_ICON = VTTG_DOCS_CHANNEL_ICONS.dev;

/** Доки dev-канала поисковикам не показываем. */
export const VTTG_DOCS_DEV_ROBOTS = 'noindex, nofollow';

/** Подсказка над доками dev-канала: они не для всех. */
export const VTTG_DOCS_DEV_NOTICE =
  'Это документация ветки разработки: она может меняться и описывать то, чего ещё нет в релизе. Видна только ролям, которым её открыли в админке.';

/** Подпись версии над страницей. */
export const VTTG_DOCS_VERSION_PREFIX = 'VTTG';

export const VTTG_DOCS_UPDATED_PREFIX = 'обновлено';

/** Разделитель частей подзаголовка: группа, версия, дата. */
export const VTTG_DOCS_SUBTITLE_SEPARATOR = ' · ';

/** Разделитель названия страницы и раздела во вкладке браузера. */
export const VTTG_DOCS_SEO_TITLE_SEPARATOR = ' — ';

/** Формат даты выкладки. */
export const VTTG_DOCS_DATE_FORMAT = 'LL';

export const VTTG_DOCS_EMPTY_TITLE = 'Документация ещё не опубликована';

export const VTTG_DOCS_EMPTY_DESCRIPTION =
  'Она появится здесь после ближайшей выкладки VTTG.';

export const VTTG_DOCS_ERROR_TITLE = 'Не удалось загрузить документацию';

export const VTTG_DOCS_FORBIDDEN_TITLE = 'Нет доступа';

export const VTTG_DOCS_FORBIDDEN_DESCRIPTION =
  'Документация ветки разработки открыта не всем. Если она вам нужна, напишите администрации.';

export const VTTG_DOCS_NOT_FOUND_TITLE = 'Страница не найдена';

export const VTTG_DOCS_NOT_FOUND_DESCRIPTION =
  'Возможно, её переименовали в новой версии документации.';

export const VTTG_DOCS_RETRY_LABEL = 'Повторить';

export const VTTG_DOCS_HOME_LABEL = 'К оглавлению';

export const VTTG_DOCS_TOC_TITLE = 'На странице';

export const VTTG_DOCS_SECTIONS_LABEL = 'Разделы';

export const VTTG_DOCS_SECTIONS_ICON = 'tabler:list';

export const VTTG_DOCS_PREVIOUS_LABEL = 'Назад';

export const VTTG_DOCS_NEXT_LABEL = 'Дальше';

/** Иконка раздела в меню пользователя и в админке. */
export const VTTG_DOCS_ICON = 'tabler:book-2';

/** Префикс ключа данных оглавления канала. */
export const VTTG_DOCS_INDEX_DATA_KEY = 'vttg-docs-index';

/** Префикс ключа данных страницы. */
export const VTTG_DOCS_PAGE_DATA_KEY = 'vttg-docs-page';

/** Разделитель частей ключа данных. */
export const VTTG_DOCS_DATA_KEY_SEPARATOR = ':';

/** Уровень заголовка, который в оглавлении страницы идёт без отступа. */
export const VTTG_DOCS_TOC_TOP_DEPTH = 2;

/** Отступ вложенного заголовка в оглавлении страницы. */
export const VTTG_DOCS_TOC_NESTED_CLASS = 'pl-3';

/** Переключатель каналов нужен, только если каналов больше одного. */
export const VTTG_DOCS_CHANNEL_SWITCH_MIN_COUNT = 2;

/** Основная кнопка мыши в `MouseEvent.button`. */
export const VTTG_DOCS_PRIMARY_MOUSE_BUTTON = 0;

/** Начало ссылки на заголовок той же страницы. */
export const VTTG_DOCS_ANCHOR_PREFIX = '#';

/** Начало ссылки на страницу сайта. */
export const VTTG_DOCS_SITE_PATH_PREFIX = '/';

/** `target` ссылки, которая открывается в новой вкладке. */
export const VTTG_DOCS_NEW_TAB_TARGET = '_blank';

/** Сколько строк-заглушек показывать, пока грузится страница. */
export const VTTG_DOCS_SKELETON_COUNT = 6;
