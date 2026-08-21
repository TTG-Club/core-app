import type {
  FilterGroup,
  FilterGroups,
  FilterItem,
  FilterItems,
} from '../types';

import { MIN_GROUP_VALUES_FOR_SEARCH, MIN_GROUPS_FOR_SEARCH } from '../model';
import { getGroupItems } from './getGroupItems';

/** Приводит строку к виду, пригодному для регистронезависимого сравнения. */
function normalizeForSearch(text: string): string {
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
    groups.length > MIN_GROUPS_FOR_SEARCH
    || groups.some(
      (group) => getGroupItems(group).length > MIN_GROUP_VALUES_FOR_SEARCH,
    )
  );
}

/**
 * Оставляет в группе значения, подходящие под запрос.
 *
 * Совпадение по названию группы показывает её значения целиком: иначе поиск по
 * названию группы приводил бы к пустой группе.
 *
 * Тронутые значения не удерживает — их добавляет `getSearchedGroupItems`.
 *
 * @param group группа фильтров.
 * @param items доступные значения группы (уже отфильтрованные каскадом).
 * @param query нормализованный поисковый запрос.
 * @returns значения, совпавшие с запросом.
 */
function getQueryMatchedItems(
  group: FilterGroup,
  items: FilterItems,
  query: string,
): FilterItems {
  if (normalizeForSearch(group.name).includes(query)) {
    return items;
  }

  return items.filter((filterItem: FilterItem) =>
    normalizeForSearch(filterItem.name).includes(query),
  );
}

/**
 * Применяет поисковый запрос к значениям группы с учётом неверной раскладки.
 *
 * Выбранные значения остаются видимыми всегда — иначе выбор, влияющий на
 * выдачу, пропал бы с экрана, и снять его было бы негде. Накладываются они
 * поверх совпадений, а не внутри поиска: иначе они выдавали бы себя за
 * успешный поиск и в группе с выбором раскладка не подхватывалась бы вовсе.
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
  const query = normalizeForSearch(search);

  if (!query) {
    return items;
  }

  const matchedItems = withLayoutFallback(query, (searchQuery) =>
    getQueryMatchedItems(group, items, searchQuery),
  );

  return items.filter(
    (filterItem: FilterItem) =>
      matchedItems.includes(filterItem) || filterItem.selected !== null,
  );
}
