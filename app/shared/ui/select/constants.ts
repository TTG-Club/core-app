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
