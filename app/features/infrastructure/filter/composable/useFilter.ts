import type { LocationQuery } from 'vue-router';

import type { Filter } from '../types';

import { isEqual } from 'es-toolkit';

import { parseFilter } from '../schema';
import {
  applyQueryToFilters,
  buildFullQuery,
  buildSearchQuery,
  collectGroupKeys,
  getFilterKey,
  normalizeDependentSelections,
} from '../utils';

/**
 * Проверяет, задаёт ли адрес страницы условия отбора или источники.
 *
 * @param pristine фильтр раздела в исходном виде — по нему известны ключи.
 * @param query параметры текущего адреса.
 * @returns `true`, если в адресе есть хотя бы один параметр фильтра.
 */
function hasFilterQuery(pristine: Filter, query: LocationQuery): boolean {
  const filterKeys = collectGroupKeys([
    ...pristine.filters,
    ...(pristine.sources ?? []),
  ]);

  filterKeys.add('source');

  return Object.keys(query).some((queryKey) => filterKeys.has(queryKey));
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

  // Выбор раздела живёт в `useState` и переживает уход на другую страницу.
  // При возвращении по ссылке без параметров он остаётся в силе; адрес с
  // параметрами (ссылкой поделились) всегда важнее запомненного.
  let isRememberedFilterKept = false;
  let isFirstDefaultsRun = true;

  watch(
    validatedDefaults,
    (value) => {
      if (!value) {
        return;
      }

      // Только на первом прогоне: дальше дефолты меняются из-за обновления
      // ответа (например, сменились источники профиля), и их надо применить.
      isRememberedFilterKept =
        isFirstDefaultsRun
        && !!filter.value
        && !hasFilterQuery(value, route.query);

      isFirstDefaultsRun = false;

      if (isRememberedFilterKept) {
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

  // Запомненный выбор в адресе ещё не отражён, а вотчер выше не сработает:
  // сам фильтр не менялся. Возвращаем параметры в адрес вручную.
  if (isRememberedFilterKept) {
    syncUrlWithFilter();
  }

  return {
    filter,
    search,
    filterQuery,
    isPending,
    defaults,
    refresh,
  };
}
