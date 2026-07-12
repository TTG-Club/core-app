import type { CreatureOption } from '~initiative/model';

import {
  BESTIARY_SEARCH_PATH,
  CREATURE_SEARCH_DEBOUNCE_MS,
  CREATURE_SEARCH_SIZE,
  parseCreatureOptions,
} from '~initiative/model';

/**
 * Автокомплит существ из бестиария для сборки энкаунтера.
 *
 * Использует тот же эндпоинт, что и страница бестиария
 * (`/api/v2/bestiary/search`), с дебаунсом ввода. `retry: 0` — чтобы
 * ofetch не удваивал запросы на 429.
 */
export function useCreatureSearch() {
  const searchTerm = ref('');
  const debouncedTerm = refDebounced(searchTerm, CREATURE_SEARCH_DEBOUNCE_MS);
  const options = ref<Array<CreatureOption>>([]);
  const isLoading = ref(false);

  watch(debouncedTerm, async (term) => {
    const query = term.trim();

    if (!query) {
      options.value = [];

      return;
    }

    isLoading.value = true;

    try {
      const response = await $fetch<unknown>(BESTIARY_SEARCH_PATH, {
        method: 'GET',
        query: { search: query, size: CREATURE_SEARCH_SIZE },
        retry: 0,
      });

      // Защита от гонки: применяем ответ, только если терм всё ещё актуален
      // (иначе поздно резолвнувшийся старый запрос затрёт свежие опции).
      if (debouncedTerm.value.trim() === query) {
        options.value = parseCreatureOptions(response);
      }
    } catch (error) {
      if (debouncedTerm.value.trim() === query) {
        consola.error('Ошибка поиска существ:', error);
        options.value = [];
      }
    } finally {
      isLoading.value = false;
    }
  });

  return {
    searchTerm,
    options,
    isLoading,
  };
}
