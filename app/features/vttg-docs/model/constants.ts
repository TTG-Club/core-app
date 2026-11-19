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

/** Доки канала, открытого не всем, поисковикам не показываем. */
export const VTTG_DOCS_PRIVATE_ROBOTS = 'noindex, nofollow';

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

/** Префикс ключа данных доступа к разделу. */
export const VTTG_DOCS_ACCESS_DATA_KEY = 'vttg-docs-access';

/** Часть ключа доступа для гостя без ролей. */
export const VTTG_DOCS_GUEST_KEY = 'guest';

/** Разделитель ролей в ключе доступа. */
export const VTTG_DOCS_ROLES_KEY_SEPARATOR = ',';

/** Подпись пункта в меню сайта: раздел уже внутри группы Virtual TTG. */
export const VTTG_DOCS_MENU_LABEL = 'Документация';

/** Префикс ключа данных страницы. */
export const VTTG_DOCS_PAGE_DATA_KEY = 'vttg-docs-page';

/** Разделитель частей ключа данных. */
export const VTTG_DOCS_DATA_KEY_SEPARATOR = ':';

/** Уровень заголовка, который в оглавлении страницы идёт без отступа. */
export const VTTG_DOCS_TOC_TOP_DEPTH = 2;

/**
 * Открытая страница в меню разделов: подложка основного цвета вместо серой,
 * чтобы выбранный пункт был заметен в длинном списке.
 */
export const VTTG_DOCS_SIDEBAR_ACTIVE_CLASS =
  'font-medium before:bg-primary/15';

/** Отступ заголовка в оглавлении страницы от линии слева. */
export const VTTG_DOCS_TOC_TOP_CLASS = 'pl-3';

/** Отступ вложенного заголовка в оглавлении страницы. */
export const VTTG_DOCS_TOC_NESTED_CLASS = 'pl-6';

/** Заголовок, который сейчас читают: линия и текст основного цвета. */
export const VTTG_DOCS_TOC_ACTIVE_CLASS =
  'border-primary font-medium text-primary';

/** Остальные заголовки оглавления. */
export const VTTG_DOCS_TOC_INACTIVE_CLASS =
  'border-transparent text-muted hover:border-accented hover:text-highlighted';

/**
 * Насколько ниже верха окна заголовок ещё считается текущим (пикселей):
 * чуть больше отступа прокрутки к якорю, чтобы клик по пункту подсвечивал его.
 */
export const VTTG_DOCS_ACTIVE_HEADING_OFFSET = 96;

/** Как часто пересчитывать текущий заголовок при прокрутке (мс). */
export const VTTG_DOCS_ACTIVE_HEADING_THROTTLE = 100;

/** Запас до конца страницы (пикселей), в котором она считается докрученной. */
export const VTTG_DOCS_PAGE_BOTTOM_TOLERANCE = 2;

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
