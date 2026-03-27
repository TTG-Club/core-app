import type { LocationQuery } from 'vue-router';

import type { Filter, FilterGroup } from '../types';

import { cloneDeep } from 'es-toolkit';

import { getGroupItems } from './getGroupItems';

/**
 * Собирает объект запроса LocationQuery (для vue-router) из состояния фильтров
 */
export function buildSearchQuery(
  filterState: Filter | undefined,
): LocationQuery {
  if (!filterState) {
    return {};
  }

  const query: LocationQuery = {};
  const selectedSources: string[] = [];

  const processGroups = (
    groups: FilterGroup[] | undefined,
    isSource: boolean,
  ) => {
    if (!groups) {
      return;
    }

    for (const group of groups) {
      const items = getGroupItems(group);
      const groupType = group.type || 'filter';

      if (groupType === 'filter') {
        const selectedIds = items
          .filter((item) => item.selected)
          .map((item) => String(item.id));

        if (selectedIds.length > 0) {
          if (isSource) {
            selectedSources.push(...selectedIds);
          } else {
            query[group.key] = selectedIds.join(',');

            if (group.mode) {
              query[`${group.key}_mode`] = '1';
            }

            if (group.union) {
              query[`${group.key}_union`] = '1';
            }
          }
        }
      } else if (groupType === 'singleton') {
        for (const item of items) {
          if (item.selected === true) {
            query[String(item.id)] = '1';
          } else if (item.selected === false) {
            query[String(item.id)] = '0';
          }
        }
      }
    }
  };

  processGroups(filterState.filters, false);
  processGroups(filterState.sources, true);

  if (selectedSources.length > 0) {
    query.source = selectedSources.join(',');
  }

  return query;
}

/**
 * Применяет параметры URL к объекту Filter и возвращает его новый экземпляр
 */
export function applyQueryToFilters(
  originalFilter: Filter,
  query: LocationQuery,
): Filter {
  const result = cloneDeep(originalFilter);

  const applyToGroups = (
    groups: FilterGroup[] | undefined,
    isSource: boolean,
  ) => {
    if (!groups) {
      return;
    }

    for (const group of groups) {
      const items = getGroupItems(group);
      const groupType = group.type || 'filter';

      if (groupType === 'filter') {
        const queryVal = isSource ? query.source : query[group.key];

        if (queryVal && typeof queryVal === 'string') {
          const selectedSet = new Set(queryVal.split(','));

          items.forEach((item) => {
            item.selected = selectedSet.has(String(item.id)) ? true : null;
          });

          if (!isSource) {
            group.mode = query[`${group.key}_mode`] === '1';
            group.union = query[`${group.key}_union`] === '1';
          }
        } else {
          if (!isSource) {
            items.forEach((item) => {
              item.selected = null;
            });

            group.mode = false;
            group.union = false;
          }
        }
      } else if (groupType === 'singleton') {
        for (const item of items) {
          const itemVal = query[String(item.id)];

          if (itemVal === '1') {
            item.selected = true;
          } else if (itemVal === '0') {
            item.selected = false;
          } else {
            item.selected = null;
          }
        }
      }
    }
  };

  applyToGroups(result.filters, false);
  applyToGroups(result.sources, true);

  return result;
}
