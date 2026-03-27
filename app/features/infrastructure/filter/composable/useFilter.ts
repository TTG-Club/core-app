import type { Filter, FilterGroup } from '../types';

import { cloneDeep } from 'es-toolkit';

import { getFilterKey } from '../utils';
import { applyQueryToFilters, buildSearchQuery } from '../utils/filterParser';

export async function useFilter(key: string, url: string) {
  const route = useRoute();
  const router = useRouter();

  const filterKey = getFilterKey(key);
  const filter = useState<Filter | undefined>(filterKey, () => undefined);

  const search = useState<string | undefined>(`${filterKey}_search`, () => {
    const q = route.query.search as string;

    return q || undefined;
  });

  const { isLoggedIn, fetch: fetchUser } = useUser();
  const requestFetch = useRequestFetch();

  const { data, status, refresh } = await useAsyncData(
    filterKey,
    async () => {
      // Ensure user profile is processed/deduped before trying to fetch settings
      await fetchUser();

      const [filterData, savedFilters] = await Promise.all([
        requestFetch<Filter>(url),
        isLoggedIn.value
          ? requestFetch<any>('/api/user/profile/saved-filter').catch(
              () => null,
            )
          : Promise.resolve(null),
      ]);

      if (filterData.sources) {
        for (const group of filterData.sources) {
          const items = group.values || group.filters || [];

          for (const item of items) {
            if (!isLoggedIn.value || !savedFilters) {
              item.selected = true;
            } else {
              const savedGroup = savedFilters.filter?.groups?.find(
                (g: any) =>
                  g.key === group.key
                  || group.key.includes(g.key)
                  || g.key.includes(group.key)
                  || g.name === group.name,
              );

              const savedItem = savedGroup?.filters?.find(
                (f: any) =>
                  f.value === item.value
                  || f.value === item.id
                  || f.name === item.name,
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

    const checkGroups = (groups?: FilterGroup[]) =>
      groups?.some((group) =>
        (group.values || group.filters || []).some(
          (item) => item.selected !== null,
        ),
      );

    return checkGroups(filter.value.filters) || false;
  });

  const selectedFiltersQuery = computed(() => buildSearchQuery(filter.value));

  function getClone(
    payload: MaybeRefOrGetter<Filter | undefined>,
  ): Filter | undefined {
    const _payload = toValue(payload);

    return _payload ? cloneDeep(_payload) : undefined;
  }

  function syncUrlWithFilter() {
    const newQuery = { ...selectedFiltersQuery.value };

    // If sources match default, omit them from the URL to keep it clean
    if (filter.value && data.value) {
      const getSourcesList = (groups?: FilterGroup[]) => {
        const list: string[] = [];

        groups?.forEach((g) => {
          (g.values || g.filters || []).forEach((i) => {
            if (i.selected) {
              list.push(String(i.id));
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
      groups?.forEach((g) => {
        if (g.type === 'filter') {
          filterKeys.add(g.key);
          filterKeys.add(`${g.key}_mode`);
          filterKeys.add(`${g.key}_union`);
        } else if (g.type === 'singleton') {
          (g.values || g.filters || []).forEach((item) =>
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

    Object.keys(cleanQuery).forEach((k) => {
      if (filterKeys.has(k) || k === 'search') {
        // eslint-disable-next-line ts/no-dynamic-delete
        delete cleanQuery[k];
      }
    });

    // To prevent infinite loop, compare if anything really changed
    const finalQuery = { ...cleanQuery, ...newQuery };

    if (JSON.stringify(route.query) !== JSON.stringify(finalQuery)) {
      router.replace({
        query: finalQuery,
      });
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

  function restoreSources() {
    if (data.value && filter.value) {
      filter.value = {
        ...filter.value,
        sources: cloneDeep(data.value.sources),
      };
    }
  }

  function restoreFilters() {
    if (data.value && filter.value) {
      filter.value = {
        ...filter.value,
        filters: cloneDeep(data.value.filters),
      };
    }
  }

  return {
    isPending,
    isShowedPreview,

    filter,
    search,
    selectedFiltersQuery,

    refresh,
    restoreSources,
    restoreFilters,
  };
}
