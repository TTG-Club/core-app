import type { FilterGroup, FilterItems } from '../types';

/**
 * Возвращает элементы группы фильтров, учитывая дуальность API (`values` / `filters`)
 */
export function getGroupItems(group: FilterGroup): FilterItems {
  return group.values || group.filters || [];
}
