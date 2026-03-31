import type { LocationQuery } from 'vue-router';

import type { Filter } from '../types';

import { collectGroupKeys } from './collectGroupKeys';
import { serializeSelectedIds } from './filterParser';

/**
 * Строит полный query-объект для URL, объединяя фильтры, search
 * и текущие query-параметры, не управляемые фильтром
 */
export function buildFullQuery(
  filterValue: Filter | undefined,
  dataValue: Filter | undefined,
  selectedQuery: LocationQuery,
  searchValue: string | undefined,
  currentRouteQuery: LocationQuery,
): LocationQuery {
  let activeQuery: LocationQuery = { ...selectedQuery };

  if (searchValue) {
    activeQuery.search = searchValue;
  }

  if (filterValue && dataValue) {
    const sourcesMatch =
      serializeSelectedIds(filterValue.sources)
      === serializeSelectedIds(dataValue.sources);

    if (sourcesMatch) {
      const defaultSourceKeys = collectGroupKeys(dataValue.sources ?? []);

      defaultSourceKeys.add('source');

      activeQuery = Object.fromEntries(
        Object.entries(activeQuery).filter(
          ([queryKey]) => !defaultSourceKeys.has(queryKey),
        ),
      );
    }
  }

  const controlledKeys = collectGroupKeys([
    ...(dataValue?.filters ?? []),
    ...(dataValue?.sources ?? []),
  ]);

  controlledKeys.add('search');
  controlledKeys.add('source');

  const preservedQuery = Object.fromEntries(
    Object.entries(currentRouteQuery).filter(
      ([queryKey]) => !controlledKeys.has(queryKey),
    ),
  );

  return { ...preservedQuery, ...activeQuery };
}
