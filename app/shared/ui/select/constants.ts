export const SELECT_DROPDOWN_DEBOUNCE_MS = 250;

export const ITEMS_SEARCH_ENDPOINT = '/api/v2/item/search';

/**
 * База пути детали предмета: по ней догружается уже выбранный предмет, если
 * его нет в текущей выдаче поиска.
 */
export const ITEM_DETAIL_ENDPOINT_PREFIX = '/api/v2/item';

export const SUBCLASS_SELECT_BASE_KEY = 'subclasses-select';

export const SUBCLASS_SELECT_MULTIPLE_PLACEHOLDER_SUFFIX = 'ы';

export const SUBCLASS_SELECT_PLACEHOLDER = 'Выбери подкласс';

export const SUBCLASSES_ENDPOINT = '/api/v2/classes/subclasses';

export const SUBCLASSES_BY_CLASS_ENDPOINT_PREFIX = '/api/v2/classes';

export const SUBCLASSES_BY_CLASS_ENDPOINT_SUFFIX = '/subclasses';

/** Подписи окна выбора записи каталога. */
export const CATALOG_PICKER_LABELS = {
  filters: 'Фильтры',
  filtersHint:
    'Фильтры те же, что в разделе каталога: отберите нужное и выбирайте из '
    + 'короткого списка.',
  resetFilters: 'Сбросить фильтры',
  searchPlaceholder: 'Поиск по названию…',
  emptyTitle: 'Ничего не найдено',
  emptySubtitle: 'Измените запрос или сбросьте фильтры',
  errorTitle: 'Список не загрузился',
  errorSubtitle: 'Проверьте соединение и попробуйте ещё раз',
  retry: 'Повторить',
  remove: 'Убрать',
  cancel: 'Отмена',
  save: 'Готово',
  open: 'Выбрать',
  change: 'Изменить',
  clear: 'Очистить',
  allTab: 'Все',
  selectedTab: 'Выбранные',
  empty: 'Ничего не выбрано',
  emptySelectedSubtitle: 'Отметьте нужное на вкладке «Все»',
  emptySelectedSearchSubtitle: 'Среди выбранного такого нет',
  selectAll: 'Все',
  selectAllAction: 'Выбрать все',
  unselectAllAction: 'Снять все',
  selectAllLimitTitle: 'Выбрано не всё',
  selectAllLimitSubtitle:
    'Отбор нашёл записей больше, чем можно отметить разом. Сузьте фильтры и '
    + 'повторите.',
  selectAllErrorTitle: 'Не удалось отметить все',
  showMore: 'Показать ещё',
  collapse: 'Свернуть',
} as const;

/** Стрелки кнопки, которая разворачивает и сворачивает остаток чипов. */
export const CATALOG_PICKER_EXPAND_ICONS = {
  expand: 'tabler:chevron-down',
  collapse: 'tabler:chevron-up',
} as const;

/**
 * Сколько чипов выбранного поле показывает, пока их не развернули.
 *
 * Полю списка заклинаний умения набирают и по сотне записей: без предела чипы
 * выстраивались бы в стену на весь экран, а форма под ними терялась.
 */
export const CATALOG_PICKER_CHIPS_LIMIT = 6;

/**
 * Насколько близко к концу списка нужно прокрутить, чтобы подгрузилась
 * следующая страница. Порог в пикселях, а не в строках: высота строки зависит
 * от того, есть ли у записи английское название.
 */
export const CATALOG_PICKER_SCROLL_THRESHOLD_PX = 200;

/**
 * Разделы каталога для окна выбора: ручки поиска, фильтров и записи.
 *
 * Одним местом на все поля: адреса раздела повторялись бы в каждом селекте, а
 * фильтры и поиск у них общие — их отдаёт бэкенд.
 */
export const CATALOG_PICKER_SECTIONS = {
  items: {
    searchPath: '/api/v2/item/search',
    filtersPath: '/api/v2/item/filters',
    filtersKey: 'catalog-picker:item-filters',
    detailPath: '/api/v2/item',
  },
  spells: {
    searchPath: '/api/v2/spells/search',
    filtersPath: '/api/v2/spells/filters',
    filtersKey: 'catalog-picker:spell-filters',
    detailPath: '/api/v2/spells',
  },
  feats: {
    searchPath: '/api/v2/feats/search',
    filtersPath: '/api/v2/feats/filters',
    filtersKey: 'catalog-picker:feat-filters',
    detailPath: '/api/v2/feats',
  },
  species: {
    searchPath: '/api/v2/species/search',
    filtersPath: '/api/v2/species/filters',
    filtersKey: 'catalog-picker:species-filters',
    detailPath: '/api/v2/species',
  },
  backgrounds: {
    searchPath: '/api/v2/backgrounds/search',
    filtersPath: '/api/v2/backgrounds/filters',
    filtersKey: 'catalog-picker:background-filters',
    detailPath: '/api/v2/backgrounds',
  },
  // Без `detailPath`: деталь класса — самый большой ответ каталога (умения,
  // таблица, подклассы), а окну нужно от неё одно название. Выдача поиска
  // отдаёт все классы разом, и догружать по одному нечего
  classes: {
    searchPath: '/api/v2/classes/search',
    filtersPath: '/api/v2/classes/filters',
    filtersKey: 'catalog-picker:class-filters',
  },
  magicItems: {
    searchPath: '/api/v2/magic-items/search',
    filtersPath: '/api/v2/magic-items/filters',
    filtersKey: 'catalog-picker:magic-item-filters',
    detailPath: '/api/v2/magic-items',
  },
} as const;

/**
 * Подписи пустого поля выбора классов: до открытия окна автор видит только их.
 *
 * Своей константой, а не строкой в шаблоне: подписи живут в `constants.ts`, а
 * склейка в шаблоне («Выбери класс» + «ы») ещё и прятала бы одну из них от
 * поиска по проекту.
 */
export const SELECT_CLASS_PLACEHOLDERS = {
  single: 'Выбери класс',
  multiple: 'Выбери классы',
} as const;

/** Заголовки окна выбора по разделам. */
export const CATALOG_PICKER_TITLES = {
  items: 'Предметы',
  spells: 'Заклинания',
  feats: 'Черты',
  species: 'Виды',
  backgrounds: 'Предыстории',
  magicItems: 'Магические предметы',
  classes: 'Классы',
} as const;

/** Ключ группы фильтра черт с категориями: им сужается набор поля. */
export const CATALOG_PICKER_FEAT_CATEGORY_GROUP = 'category';

/** Ключ группы фильтра с источниками: он одинаков во всех разделах. */
export const CATALOG_PICKER_SOURCE_GROUP = 'source';

/** Ключ группы фильтра предметов с категорией: им сужается набор поля. */
export const CATALOG_PICKER_ITEM_TYPE_GROUP = 'itemType';

/**
 * Категории предметов, которые считаются оружием.
 *
 * Нужны полям про оружие и оружейные приёмы: приём берётся у самого оружия, и
 * выбирать его среди амулетов и барабанов не из чего.
 */
export const WEAPON_ITEM_TYPES: Array<string> = [
  'WEAPON',
  'SIMPLE_WEAPON',
  'MARTIAL_WEAPON',
  'MELEE_WEAPON',
  'RANGED_WEAPON',
  'FIREARM',
  'FUTURISTIC',
];

/** Категории предметов, которые считаются инструментами. */
export const TOOL_ITEM_TYPES: Array<string> = [
  'TOOL',
  'ARTISAN_S_TOOLS',
  'GAMING_SET',
  'INSTRUMENT',
];
