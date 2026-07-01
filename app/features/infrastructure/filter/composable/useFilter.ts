import type { Filter } from '../types';

import { cloneDeep, isEqual } from 'es-toolkit';

import {
  applyQueryToFilters,
  buildFullQuery,
  buildSearchQuery,
  getFilterKey,
  getGroupItems,
  normalizeDependentSelections,
} from '../utils';

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

  const {
    data: defaults,
    status,
    refresh,
  } = await useFetch<Filter>(url, {
    key: filterKey,
    deep: false,
  });

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

  const filterQuery = computed(() => buildSearchQuery(filter.value));

  function syncUrlWithFilter() {
    const normalizedFilters = normalizeDependentSelections(
      filter.value?.filters ?? [],
    );

    if (filter.value && !isEqual(filter.value.filters, normalizedFilters)) {
      filter.value = { ...filter.value, filters: normalizedFilters };

      return;
    }

    const finalQuery = buildFullQuery(
      filter.value,
      defaults.value ?? undefined,
      filterQuery.value,
      search.value,
      route.query,
    );

    if (!isEqual(route.query, finalQuery)) {
      router.replace({ query: finalQuery });
    }
  }

  watch(
    defaults,
    (value) => {
      if (!value) {
        return;
      }

      const cloned = cloneDeep(value);

      const nextFilter = applyQueryToFilters(cloned, route.query);

      filter.value = {
        ...nextFilter,
        filters: normalizeDependentSelections(nextFilter.filters),
      };
    },
    { immediate: true },
  );

  watch(
    [filterQuery, search],
    () => {
      syncUrlWithFilter();
    },
    { deep: true },
  );

  watch(
    () => route.query,
    () => {
      if (!defaults.value) {
        return;
      }

      const pristine = cloneDeep(defaults.value);
      const prevFiltersQuery = JSON.stringify(filterQuery.value);
      const testFilter = applyQueryToFilters(pristine, route.query);
      const nextFiltersQuery = JSON.stringify(buildSearchQuery(testFilter));

      if (prevFiltersQuery !== nextFiltersQuery) {
        filter.value = {
          ...testFilter,
          filters: normalizeDependentSelections(testFilter.filters),
        };
      }
    },
    { deep: true },
  );

  return {
    filter,
    search,
    filterQuery,
    isPending,
    isShowedPreview,
    defaults,
    refresh,
  };
}
