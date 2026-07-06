import type { FilterGroup, FilterItems } from '../types';

import { getGroupItems } from './getGroupItems';

/**
 * Возвращает строковые идентификаторы выбранных элементов группы.
 * Единый источник для сборки query, сравнения состояний и каскада.
 */
export function getSelectedItemIds(group: FilterGroup): Array<string> {
  return getGroupItems(group)
    .filter((filterItem) => filterItem.selected)
    .map((filterItem) => String(filterItem.id));
}

/**
 * Проверяет, есть ли в наборе хотя бы один тронутый пользователем элемент.
 * Тронутым считается элемент с `selected !== null` (включён или исключён).
 */
export function hasTouchedItem(items: FilterItems): boolean {
  return items.some((filterItem) => filterItem.selected !== null);
}
