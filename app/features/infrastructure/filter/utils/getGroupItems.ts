import type { FilterGroup, FilterItems } from '../types';

/**
 * Возвращает элементы группы фильтров
 */
export function getGroupItems(group: FilterGroup): FilterItems {
  return group.values || [];
}
