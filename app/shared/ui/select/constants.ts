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
  chosen: 'Выбрано',
  remove: 'Убрать',
  cancel: 'Отмена',
  save: 'Готово',
  open: 'Выбрать',
  change: 'Изменить',
  clear: 'Очистить',
  empty: 'Ничего не выбрано',
} as const;

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
  magicItems: {
    searchPath: '/api/v2/magic-items/search',
    filtersPath: '/api/v2/magic-items/filters',
    filtersKey: 'catalog-picker:magic-item-filters',
    detailPath: '/api/v2/magic-items',
  },
} as const;

/** Заголовки окна выбора по разделам. */
export const CATALOG_PICKER_TITLES = {
  items: 'Предметы',
  spells: 'Заклинания',
  feats: 'Черты',
  species: 'Виды',
  backgrounds: 'Предыстории',
  magicItems: 'Магические предметы',
} as const;

/** Ключ группы фильтра черт с категориями: им сужается набор поля. */
export const CATALOG_PICKER_FEAT_CATEGORY_GROUP = 'category';

/** Ключ группы фильтра с источниками: он одинаков во всех разделах. */
export const CATALOG_PICKER_SOURCE_GROUP = 'source';
