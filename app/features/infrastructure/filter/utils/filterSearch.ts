import type {
  FilterGroup,
  FilterGroups,
  FilterItem,
  FilterItems,
} from '../types';

import { getGroupItems } from './getGroupItems';

/** Порог, после которого дровер получает поле поиска: либо групп больше пяти, либо хотя бы в одной группе больше двадцати значений. Разделы вроде «Классов» (две группы, пять значений) помещаются на экран целиком, и поле там — лишний элемент управления. */
const SEARCHABLE_GROUPS_COUNT = 5;
const SEARCHABLE_GROUP_VALUES_COUNT = 20;

/** Приводит строку к виду, пригодному для регистронезависимого сравнения. */
function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Определяет, нужно ли показывать поиск для набора групп.
 *
 * @param groups группы фильтров конкретного дровера.
 * @returns `true`, если групп или значений в них достаточно много.
 */
export function isFilterSearchable(groups: FilterGroups): boolean {
  return (
    groups.length > SEARCHABLE_GROUPS_COUNT
    || groups.some(
      (group) => getGroupItems(group).length > SEARCHABLE_GROUP_VALUES_COUNT,
    )
  );
}

/**
 * Оставляет в группе значения, подходящие под запрос.
 *
 * Совпадение по названию группы показывает её значения целиком: иначе поиск по названию группы приводил бы к пустой группе. Выбранные значения остаются видимыми всегда — иначе выбор, влияющий на выдачу, пропал бы с экрана, и снять его было бы негде.
 *
 * @param group группа фильтров.
 * @param items доступные значения группы (уже отфильтрованные каскадом).
 * @param query нормализованный поисковый запрос.
 * @returns значения, которые следует отрисовать.
 */
function getMatchedItems(
  group: FilterGroup,
  items: FilterItems,
  query: string,
): FilterItems {
  if (normalize(group.name).includes(query)) {
    return items;
  }

  return items.filter(
    (filterItem: FilterItem) =>
      normalize(filterItem.name).includes(query)
      || filterItem.selected !== null,
  );
}

/**
 * Применяет поисковый запрос к значениям группы с учётом неверной раскладки.
 *
 * Раскладка пробуется только когда прямой запрос ничего не нашёл — тем же фолбэком, что и в поиске по каталогам листа персонажа, чтобы конверсия не добавляла ложных совпадений к успешному запросу.
 *
 * @param group группа фильтров.
 * @param items доступные значения группы.
 * @param search строка из поля поиска (может быть пустой).
 * @returns значения, которые следует отрисовать.
 */
export function getSearchedGroupItems(
  group: FilterGroup,
  items: FilterItems,
  search: string,
): FilterItems {
  const query = normalize(search);

  if (!query) {
    return items;
  }

  const matched = getMatchedItems(group, items, query);

  if (matched.length) {
    return matched;
  }

  const layoutQuery = normalize(convertKeyboardLayout(query));

  return layoutQuery === query
    ? matched
    : getMatchedItems(group, items, layoutQuery);
}
