import type { FilterGroups } from '../types';

import { getGroupItems } from './getGroupItems';

/**
 * Собирает все ключи URL-параметров, контролируемых группами фильтров
 */
export function collectGroupKeys(groups: FilterGroups): Set<string> {
  const keys = new Set<string>();

  for (const group of groups) {
    if (group.type === 'filter') {
      keys.add(group.key);
      keys.add(`${group.key}_mode`);
      keys.add(`${group.key}_union`);
    } else if (group.type === 'singleton') {
      for (const item of getGroupItems(group)) {
        keys.add(String(item.id));
      }
    }
  }

  return keys;
}
