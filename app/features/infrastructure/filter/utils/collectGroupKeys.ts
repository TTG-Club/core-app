import type { FilterGroups } from '../types';

/**
 * Собирает все ключи URL-параметров, контролируемых группами фильтров
 */
export function collectGroupKeys(groups: FilterGroups): Set<string> {
  const keys = new Set<string>();

  for (const group of groups) {
    keys.add(group.key);
    keys.add(`${group.key}_mode`);
    keys.add(`${group.key}_union`);
  }

  return keys;
}
