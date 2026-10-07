import type { MaybeRefOrGetter } from 'vue';

import type { FilterGroups } from '../types';

import { FILTER_SEARCH_DEBOUNCE } from '../model';
import { isFilterSearchable } from '../utils';

/**
 * Поиск по группам фильтра — общий для дровера и списка в панели раздела.
 *
 * Сам список считает `FilterList`: сюда он сообщает только, осталось ли в нём
 * что-нибудь, а отсюда получает запрос, по которому отбирать значения.
 *
 * @param groups группы фильтра, по которым идёт поиск.
 * @returns поле запроса, применяемый запрос и признаки показа поля и пустой выдачи.
 */
export function useFilterSearch(groups: MaybeRefOrGetter<FilterGroups>) {
  const search = ref('');
  const isEmpty = ref(false);

  // Поле остаётся на `search`, чтобы ввод не тормозил, а список считается по
  // дебаунснутому значению.
  const debouncedSearch = refDebounced(search, FILTER_SEARCH_DEBOUNCE);

  // Пустой запрос применяется без задержки: после крестика очистки список
  // иначе ещё 200 мс оставался бы отфильтрованным запросом, которого в поле
  // уже нет.
  const appliedSearch = computed(() =>
    search.value ? debouncedSearch.value : '',
  );

  const isSearchable = computed(() => isFilterSearchable(toValue(groups)));

  // Пустое состояние только для непустого запроса: без него пустой список
  // означает, что фильтры ещё не пришли, а не что ничего не нашлось.
  const showEmptyResult = computed(
    () => isSearchable.value && !!appliedSearch.value && isEmpty.value,
  );

  return {
    search,
    isEmpty,
    appliedSearch,
    isSearchable,
    showEmptyResult,
  };
}
