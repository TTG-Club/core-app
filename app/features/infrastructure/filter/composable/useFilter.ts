import type { Filter, SavedFilterResponse } from '../types';

import { cloneDeep, isEqual } from 'es-toolkit';

import {
  applyQueryToFilters,
  buildFullQuery,
  buildSearchQuery,
  findSavedGroup,
  getFilterKey,
  getGroupItems,
  resolveItemSelection,
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

  const { isLoggedIn, fetch: fetchUser } = useUser();
  const requestFetch = useRequestFetch();

  const {
    data: defaults,
    status,
    refresh,
  } = await useAsyncData(
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

  const filterQuery = computed(() => buildSearchQuery(filter.value));

  function syncUrlWithFilter() {
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

      filter.value = applyQueryToFilters(cloned, route.query);
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
        filter.value = testFilter;
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
