import type { FilterGroup, FilterGroups, FilterItems } from '../types';

import { getGroupItems } from './getGroupItems';

/** Возвращает идентификаторы выбранных значений указанной группы. */
function getSelectedIds(groups: FilterGroups, groupKey: string): Set<string> {
  const sourceGroup = groups.find((group) => group.key === groupKey);

  if (!sourceGroup) {
    return new Set<string>();
  }

  return new Set(
    getGroupItems(sourceGroup)
      .filter((filterItem) => filterItem.selected)
      .map((filterItem) => String(filterItem.id)),
  );
}

/**
 * Проверяет доступность значения с учётом выбранных значений родительских групп.
 * Пустой родительский фильтр не ограничивает дочерние значения.
 */
function isItemAvailable(
  relations: Record<string, Array<string | number>> | undefined,
  groups: FilterGroups,
): boolean {
  if (!relations) {
    return true;
  }

  return Object.entries(relations).every(([parentKey, relatedIds]) => {
    const selectedParentIds = getSelectedIds(groups, parentKey);

    return (
      selectedParentIds.size === 0
      || relatedIds.some((relatedId) =>
        selectedParentIds.has(String(relatedId)),
      )
    );
  });
}

/** Возвращает доступные значения группы согласно связям `relations`. */
export function getAvailableGroupItems(
  group: FilterGroup,
  groups: FilterGroups,
): FilterItems {
  return getGroupItems(group).filter((filterItem) =>
    isItemAvailable(filterItem.relations, groups),
  );
}

/** Определяет, зависит ли дочерняя группа от родительской группы. */
export function isGroupDependentOn(
  childGroup: FilterGroup,
  parentKey: string,
): boolean {
  return getGroupItems(childGroup).some(
    (filterItem) => filterItem.relations?.[parentKey] !== undefined,
  );
}

/**
 * Сбрасывает выбранные значения, ставшие недоступными после изменения родителей.
 * Порядок групп позволяет последовательно обработать многоуровневый каскад.
 */
export function normalizeDependentSelections(
  groups: FilterGroups,
): FilterGroups {
  return groups.reduce<FilterGroups>((normalizedGroups, group) => {
    const remainingGroups = groups.slice(normalizedGroups.length + 1);
    const currentGroups = [...normalizedGroups, group, ...remainingGroups];

    const availableIds = new Set(
      getAvailableGroupItems(group, currentGroups).map((filterItem) =>
        String(filterItem.id),
      ),
    );

    const values = getGroupItems(group).map((filterItem) => ({
      ...filterItem,
      selected: availableIds.has(String(filterItem.id))
        ? filterItem.selected
        : null,
    }));

    const hasSelection = values.some((filterItem) => filterItem.selected);

    normalizedGroups.push({
      ...group,
      values,
      mode: hasSelection ? group.mode : false,
      union: hasSelection ? group.union : false,
    });

    return normalizedGroups;
  }, []);
}
