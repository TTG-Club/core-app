import type { Filter, FilterGroup, SavedFilterResponse } from '../types';

import { cloneDeep } from 'es-toolkit';

import {
  applyQueryToFilters,
  buildSearchQuery,
  getFilterKey,
  getGroupItems,
} from '../utils';

export async function useFilter(key: string, url: string) {
  const route = useRoute();
  const router = useRouter();

  const filterKey = getFilterKey(key);
  const filter = useState<Filter | undefined>(filterKey, () => undefined);

  const search = useState<string | undefined>(`${filterKey}_search`, () => {
    const querySearch = route.query.search as string;

    return querySearch || undefined;
  });

  const { isLoggedIn, fetch: fetchUser } = useUser();
  const requestFetch = useRequestFetch();

  /**
   * Флаг для предотвращения цикла watcher'ов:
   * filter → query → filter
   */
  let isInternalUpdate = false;

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

      if (filterData.sources) {
        for (const group of filterData.sources) {
          const items = getGroupItems(group);

          for (const item of items) {
            if (!isLoggedIn.value || !savedFilters) {
              item.selected = true;
            } else {
              const savedGroup = savedFilters.filter?.groups?.find(
                (saved) =>
                  saved.key === group.key
                  || group.key.includes(saved.key)
                  || saved.key.includes(group.key)
                  || saved.name === group.name,
              );

              const savedItem = savedGroup?.filters?.find(
                (saved) =>
                  saved.value === item.value
                  || saved.value === String(item.id)
                  || saved.name === item.name,
              );

              item.selected = savedItem?.selected ?? true;
            }
          }
        }
      }

      return filterData;
    },
    { deep: false },
  );

  const isPending = computed(() => status.value === 'pending');

  const isShowedPreview = computed(() => {
    if (!filter.value) {
      return false;
    }

    return (
      filter.value.filters?.some((group) =>
        getGroupItems(group).some((item) => item.selected !== null),
      ) || false
    );
  });

  const selectedFiltersQuery = computed(() => buildSearchQuery(filter.value));

  function getClone(
    payload: MaybeRefOrGetter<Filter | undefined>,
  ): Filter | undefined {
    const resolved = toValue(payload);

    return resolved ? cloneDeep(resolved) : undefined;
  }

  function syncUrlWithFilter() {
    const newQuery = { ...selectedFiltersQuery.value };

    if (filter.value && data.value) {
      const getSourcesList = (groups?: FilterGroup[]) => {
        const list: string[] = [];

        groups?.forEach((group) => {
          getGroupItems(group).forEach((item) => {
            if (item.selected) {
              list.push(String(item.id));
            }
          });
        });

        return list.sort().join(',');
      };

      if (
        getSourcesList(filter.value.sources)
        === getSourcesList(data.value.sources)
      ) {
        delete newQuery.source;
      }
    }

    if (search.value) {
      newQuery.search = search.value;
    }

    const filterKeys = new Set<string>();

    filterKeys.add('source');

    const collectKeys = (groups?: FilterGroup[]) => {
      groups?.forEach((group) => {
        if (group.type === 'filter') {
          filterKeys.add(group.key);
          filterKeys.add(`${group.key}_mode`);
          filterKeys.add(`${group.key}_union`);
        } else if (group.type === 'singleton') {
          getGroupItems(group).forEach((item) =>
            filterKeys.add(String(item.id)),
          );
        }
      });
    };

    if (data.value) {
      collectKeys(data.value.filters);
      collectKeys(data.value.sources);
    }

    const cleanQuery = { ...route.query };

    Object.keys(cleanQuery).forEach((queryKey) => {
      if (filterKeys.has(queryKey) || queryKey === 'search') {
        // eslint-disable-next-line ts/no-dynamic-delete
        delete cleanQuery[queryKey];
      }
    });

    const finalQuery = { ...cleanQuery, ...newQuery };

    if (JSON.stringify(route.query) !== JSON.stringify(finalQuery)) {
      isInternalUpdate = true;

      router.replace({ query: finalQuery });
    }
  }

  watch(
    data,
    (value) => {
      if (!value) {
        return;
      }

      const cloned = getClone(value);

      if (cloned) {
        // Устанавливаем filter.value сразу с применёнными URL-параметрами,
        // чтобы не триггерить перезапись URL пустыми значениями.
        isInternalUpdate = true;
        filter.value = applyQueryToFilters(cloned, route.query);
      }
    },
    { immediate: true },
  );

  watch(
    selectedFiltersQuery,
    () => {
      syncUrlWithFilter();
    },
    { deep: true },
  );

  watch(search, () => {
    syncUrlWithFilter();
  });

  watch(
    () => route.query,
    () => {
      if (isInternalUpdate) {
        isInternalUpdate = false;

        return;
      }

      if (data.value) {
        const pristine = getClone(data.value);

        if (!pristine) {
          return;
        }

        const prevFiltersQuery = JSON.stringify(selectedFiltersQuery.value);
        const testFilter = applyQueryToFilters(pristine, route.query);
        const nextFiltersQuery = JSON.stringify(buildSearchQuery(testFilter));

        if (prevFiltersQuery !== nextFiltersQuery) {
          filter.value = testFilter;
        }
      }
    },
    { deep: true },
  );

  return {
    isPending,
    isShowedPreview,

    filter,
    search,
    selectedFiltersQuery,

    refresh,
  };
}
