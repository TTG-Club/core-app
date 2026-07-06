import type { Filter } from '../types';

import { isEqual } from 'es-toolkit';

import { parseFilter } from '../schema';
import {
  applyQueryToFilters,
  buildFullQuery,
  buildSearchQuery,
  getFilterKey,
  getGroupItems,
  hasTouchedItem,
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

  // Внешние данные API не доверенные: валидируем/санитизируем один раз на
  // изменение ответа, чтобы каскад работал с проверенными дефолтами.
  const validatedDefaults = computed(() =>
    defaults.value ? parseFilter(defaults.value) : undefined,
  );

  const isPending = computed(() => status.value === 'pending');

  const isShowedPreview = computed(() => {
    if (!filter.value) {
      return false;
    }

    return (
      filter.value.filters?.some((group) =>
        hasTouchedItem(getGroupItems(group)),
      ) || false
    );
  });

  const filterQuery = computed(() => buildSearchQuery(filter.value));

  /**
   * Синхронизирует URL с состоянием фильтра. Сначала нормализует каскадные
   * зависимости; если это изменило выбор — обновляет `filter.value` и выходит,
   * дожидаясь повторного прогона вотчера.
   *
   * Присваивание `filter.value` меняет `filterQuery`, из-за чего watcher вызывает
   * эту функцию снова — потенциальный цикл. Он завершается, потому что
   * `normalizeDependentSelections` идемпотентна: на втором прогоне результат
   * равен входу, `isEqual` возвращает true, и функция переходит к сборке query.
   */
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
      validatedDefaults.value,
      filterQuery.value,
      search.value,
      route.query,
    );

    if (!isEqual(route.query, finalQuery)) {
      router.replace({ query: finalQuery });
    }
  }

  watch(
    validatedDefaults,
    (value) => {
      if (!value) {
        return;
      }

      const nextFilter = applyQueryToFilters(value, route.query);

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
      const pristine = validatedDefaults.value;

      if (!pristine) {
        return;
      }

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
