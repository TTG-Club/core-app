import type { LocationQuery } from 'vue-router';

import type { Filter, FilterGroup, FilterGroups, FilterItems } from '../types';

import { getGroupItems } from './getGroupItems';

/**
 * Создаёт новый массив `items` с обновлённым состоянием `selected`
 * без мутации оригинальных объектов
 */
function applySelectionToItems(
  items: FilterItems,
  selectedSet: Set<string>,
): FilterItems {
  return items.map((item) => ({
    ...item,
    selected: selectedSet.has(String(item.id)) ? true : null,
  }));
}

/**
 * Собирает объект `LocationQuery` (для `vue-router`) из состояния фильтров
 */
export function buildSearchQuery(
  filterState: Filter | undefined,
): LocationQuery {
  if (!filterState) {
    return {};
  }

  const query: LocationQuery = {};

  for (const group of filterState.filters ?? []) {
    const selectedIds = getGroupItems(group)
      .filter((item) => item.selected)
      .map((item) => String(item.id));

    if (selectedIds.length > 0) {
      query[group.key] = selectedIds.join(',');

      if (group.mode) {
        query[`${group.key}_mode`] = '1';
      }

      if (group.union) {
        query[`${group.key}_union`] = '1';
      }
    }
  }

  const sourceIds = (filterState.sources ?? []).flatMap((group) =>
    getGroupItems(group)
      .filter((item) => item.selected)
      .map((item) => String(item.id)),
  );

  if (sourceIds.length > 0) {
    query.source = sourceIds.join(',');
  }

  return query;
}

/**
 * Применяет параметры URL к объекту `Filter` и возвращает новый экземпляр
 * без мутации оригинала
 */
export function applyQueryToFilters(
  originalFilter: Filter,
  query: LocationQuery,
): Filter {
  const mapGroups = (
    groups: FilterGroups | undefined,
    isSource: boolean,
  ): FilterGroups | undefined => {
    if (!groups) {
      return undefined;
    }

    return groups.map((group) => {
      const items = getGroupItems(group);

      const queryVal = isSource ? query.source : query[group.key];

      if (queryVal && typeof queryVal === 'string') {
        const selectedSet = new Set(queryVal.split(','));

        return {
          ...group,
          values: applySelectionToItems(items, selectedSet),
          ...(!isSource && {
            mode: query[`${group.key}_mode`] === '1',
            union: query[`${group.key}_union`] === '1',
          }),
        };
      }

      if (!isSource) {
        return {
          ...group,
          mode: false,
          union: false,
          values: items.map((item) => ({ ...item, selected: null })),
        };
      }

      return group;
    });
  };

  return {
    ...originalFilter,
    filters: mapGroups(originalFilter.filters, false) ?? [],
    sources: mapGroups(originalFilter.sources, true),
  };
}

/**
 * Сериализует выбранные элементы групп в строку отсортированных ID
 * для сравнения состояний фильтров
 */
export function serializeSelectedIds(groups?: FilterGroup[]): string {
  if (!groups) {
    return '';
  }

  return groups
    .flatMap((group) => {
      return getGroupItems(group)
        .filter((item) => item.selected)
        .map((item) => String(item.id));
    })
    .sort()
    .join(',');
}
