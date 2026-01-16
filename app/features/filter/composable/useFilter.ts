// composables/useFilter.ts
import { cloneDeep } from 'lodash-es';

import { getFilterKey } from '../utils';
import {
  applyCompressedFilters,
  compressFilters,
  decompressFilters,
  getSelectedFilters,
} from '../utils/filterParser';

import type { Filter } from '../types';

export async function useFilter(key: string, url: string) {
  const filterKey = getFilterKey(key);
  const filter = useState<Filter | undefined>(filterKey, () => undefined);

  const route = useRoute();
  const router = useRouter();

  const { data, status, refresh } = await useAsyncData(
    filterKey,
    () => $fetch<Filter>(url),
    { deep: false },
  );

  const isPending = computed(() => status.value === 'pending');

  const isShowedPreview = computed(() =>
    filter.value?.groups.some((group) =>
      group.filters.some((item) => item.selected !== null),
    ),
  );

  const selectedFilters = computed(() => getSelectedFilters(filter.value));
  const filterString = computed(() => compressFilters(selectedFilters.value));

  const filterStringFromUrl = computed(() => {
    const param = route.query.filter;

    return typeof param === 'string' ? param : '';
  });

  function getClone(
    payload: MaybeRefOrGetter<Filter | undefined>,
  ): Filter | undefined {
    const _payload = toValue(payload);

    return _payload ? cloneDeep(_payload) : undefined;
  }

  function syncUrlWithFilter() {
    const currentUrlFilter = filterStringFromUrl.value;
    const newFilterString = filterString.value;

    if (currentUrlFilter === newFilterString) {
      return;
    }

    if (!newFilterString) {
      const { filter: _, ...restQuery } = route.query;

      router.replace({ query: restQuery });

      return;
    }

    router.replace({
      query: { ...route.query, filter: newFilterString },
    });
  }

  function applyFiltersFromUrl(urlFilter: string) {
    if (!urlFilter || !data.value) {
      return;
    }

    try {
      const decompressed = decompressFilters(urlFilter);

      if (decompressed) {
        filter.value = applyCompressedFilters(data.value, decompressed);
      }
    } catch (error) {
      console.error('Failed to apply filters from URL:', error);
    }
  }

  // Инициализация: загрузили данные -> применили фильтр из URL
  watch(
    data,
    (value) => {
      if (value) {
        filter.value = getClone(value);
        applyFiltersFromUrl(filterStringFromUrl.value);
      }
    },
    { immediate: true },
  );

  // Изменился фильтр -> обновляем URL
  watch(
    selectedFilters,
    () => {
      syncUrlWithFilter();
    },
    { deep: true },
  );

  // Изменился URL извне -> применяем к фильтру
  watch(filterStringFromUrl, (newUrlFilter) => {
    // Если URL изменился не из-за нашего syncUrlWithFilter
    if (newUrlFilter !== filterString.value && data.value) {
      applyFiltersFromUrl(newUrlFilter);
    }
  });

  return {
    isPending,
    isShowedPreview,

    filter,
    filterString,
    filterStringFromUrl,
    selectedFilters,

    refresh,
  };
}
