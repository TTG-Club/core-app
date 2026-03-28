import type { LocationQuery } from 'vue-router';

import type {
  Filter,
  SavedFilterGroup,
  SavedFilterItem,
  SavedFilterResponse,
} from '../types';

import { cloneDeep, isEqual } from 'es-toolkit';

import {
  applyQueryToFilters,
  buildSearchQuery,
  collectGroupKeys,
  getFilterKey,
  getGroupItems,
  serializeSelectedIds,
} from '../utils';

/**
 * Находит соответствующую сохранённую группу по ключу и имени.
 * Приоритет: точное совпадение (key + name) → единственная группа с таким key.
 */
function findSavedGroup(
  savedGroups: SavedFilterGroup[],
  groupKey: string,
  groupName: string,
): SavedFilterGroup | undefined {
  // 1. Попытка точного совпадения по имени (названия уникальны: "Базовые", "Сеттинги")
  const exactByName = savedGroups.find(
    (entry) => entry.name?.trim() === groupName?.trim(),
  );

  if (exactByName) {
    return exactByName;
  }

  // 2. Если по имени не нашли, ищем по ключу (безопасный fallback)
  const sourceAliases = ['source', 'sources', 'book', 'books'];
  const isSourceKey = sourceAliases.includes(groupKey);

  const byKey = savedGroups.filter((entry) =>
    isSourceKey ? sourceAliases.includes(entry.key) : entry.key === groupKey,
  );

  if (byKey.length === 1) {
    return byKey[0];
  }

  return undefined;
}

/**
 * Определяет, выбран ли элемент в сохранённом фильтре
 */
function resolveItemSelection(
  item: { id: string | number; value: string; name: string },
  savedGroup: SavedFilterGroup | undefined,
  isLoggedIn: boolean,
): boolean | null {
  if (!isLoggedIn || !savedGroup) {
    return null;
  }

  const savedItem = savedGroup.filters.find((entry: SavedFilterItem) => {
    const entryVal = String(entry.value).toLowerCase();

    return (
      entryVal === String(item.value).toLowerCase()
      || entryVal === String(item.id).toLowerCase()
    );
  });

  return savedItem && savedItem.selected === true ? true : null;
}

/**
 * Строит полный query-объект для URL, объединяя фильтры, search
 * и текущие query-параметры, не управляемые фильтром
 */
function buildFullQuery(
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

  // Если sources не изменены — убираем их ключи из URL
  if (filterValue && dataValue) {
    const sourcesMatch =
      serializeSelectedIds(filterValue.sources)
      === serializeSelectedIds(dataValue.sources);

    if (sourcesMatch) {
      const defaultSourceKeys = collectGroupKeys(dataValue.sources ?? []);

      activeQuery = Object.fromEntries(
        Object.entries(activeQuery).filter(
          ([queryKey]) => !defaultSourceKeys.has(queryKey),
        ),
      );
    }
  }

  // Сохраняем query-параметры, не управляемые фильтром
  const controlledKeys = collectGroupKeys([
    ...(dataValue?.filters ?? []),
    ...(dataValue?.sources ?? []),
  ]);

  controlledKeys.add('search');

  const preservedQuery = Object.fromEntries(
    Object.entries(currentRouteQuery).filter(
      ([queryKey]) => !controlledKeys.has(queryKey),
    ),
  );

  return { ...preservedQuery, ...activeQuery };
}

export async function useFilter(key: string, url: string) {
  const route = useRoute();
  const router = useRouter();

  const filterKey = getFilterKey(key);
  const filter = useState<Filter | undefined>(filterKey, () => undefined);

  const search = useState<string | undefined>(`${filterKey}_search`, () => {
    const searchVal = route.query.search;

    const searchStr = Array.isArray(searchVal) ? searchVal[0] : searchVal;

    return typeof searchStr === 'string' && searchStr ? searchStr : undefined;
  });

  const { isLoggedIn, fetch: fetchUser } = useUser();
  const requestFetch = useRequestFetch();

  const { data, status, refresh } = await useAsyncData(
    filterKey,
    async () => {
      await fetchUser();

      const [filterData, savedFilters] = await Promise.all([
        requestFetch<Filter>(url),
        isLoggedIn.value
          ? requestFetch<SavedFilterResponse>(
              '/api/user/profile/saved-filter',
            ).catch(() => null)
          : Promise.resolve(null),
      ]);

      const result = cloneDeep(filterData);
      const savedGroups = savedFilters?.filter?.groups ?? [];

      if (result.sources) {
        for (const group of result.sources) {
          const savedGroup = findSavedGroup(savedGroups, group.key, group.name);

          for (const item of getGroupItems(group)) {
            item.selected = resolveItemSelection(
              item,
              savedGroup,
              isLoggedIn.value,
            );
          }
        }
      }

      return result;
    },
    { deep: false },
  );

  const isPending = computed(() => status.value === 'pending');

  const isShowedPreview = computed(() => {
    if (!filter.value) {
      return false;
    }

    return (
      filter.value.filters?.some((group) => {
        return getGroupItems(group).some((item) => item.selected !== null);
      }) || false
    );
  });

  const selectedFiltersQuery = computed(() => buildSearchQuery(filter.value));

  function syncUrlWithFilter() {
    const finalQuery = buildFullQuery(
      filter.value,
      data.value ?? undefined,
      selectedFiltersQuery.value,
      search.value,
      route.query,
    );

    if (!isEqual(route.query, finalQuery)) {
      router.replace({ query: finalQuery });
    }
  }

  watch(
    data,
    (value) => {
      if (!value) {
        return;
      }

      const cloned = cloneDeep(value);

      // Устанавливаем filter.value сразу с применёнными URL-параметрами
      filter.value = applyQueryToFilters(cloned, route.query);
    },
    { immediate: true },
  );

  watch(
    [selectedFiltersQuery, search],
    () => {
      syncUrlWithFilter();
    },
    { deep: true },
  );

  watch(
    () => route.query,
    () => {
      if (!data.value) {
        return;
      }

      const pristine = cloneDeep(data.value);
      const prevFiltersQuery = JSON.stringify(selectedFiltersQuery.value);
      const testFilter = applyQueryToFilters(pristine, route.query);
      const nextFiltersQuery = JSON.stringify(buildSearchQuery(testFilter));

      if (prevFiltersQuery !== nextFiltersQuery) {
        filter.value = testFilter;
      }
    },
    { deep: true },
  );

  return {
    filter,
    search,
    selectedFiltersQuery,
    isPending,
    isShowedPreview,
    data,
    refresh,
  };
}
