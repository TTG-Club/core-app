import type { MaybeRefOrGetter } from 'vue';

import { fetchCities } from '../model';

/** Пауза перед запросом: подсказки не гонятся за каждой буквой. */
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Справочник городов для поля города.
 *
 * Ищет сервис поиска игр: справочник живёт там же, где игры, и растёт вместе
 * с ними. Смысл его не в полноте, а в одинаковом написании — иначе фильтр
 * каталога рассыпается на «Санкт-Петербург», «СПб» и «спб».
 *
 * @param term Что набрали в поле; пусто — предлагаются крупнейшие города.
 */
export function useCityDictionary(term: MaybeRefOrGetter<string>) {
  const query = computed(() => toValue(term).trim());
  const debounced = refDebounced(query, SEARCH_DEBOUNCE_MS);

  const { data: cities, status } = useAsyncData(
    () => `find-game-cities-${debounced.value}`,
    () => fetchCities(debounced.value),
    { watch: [debounced], server: false, deep: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Названия для выбора. В игре хранится именно название: сервис держит город
   * строкой, и объявление читается без обращения к справочнику.
   */
  const cityNames = computed(() =>
    (cities.value ?? []).map((city) => city.name),
  );

  return { cityNames, isLoading };
}
