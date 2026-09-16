import type { Ref, WritableComputedRef } from 'vue';

/**
 * Мост между нумерацией страниц Nuxt UI и сервиса: `UiPagination` считает
 * страницы с единицы, а сервис и состояние каталога — с нуля.
 *
 * Отдельный композабл, потому что мост нужен каждому постраничному списку
 * раздела, а два одинаковых `computed` в компонентах разъезжаются при первой
 * же правке.
 *
 * @param page Страница с нуля — состояние списка.
 */
export function useHumanPage(page: Ref<number>): WritableComputedRef<number> {
  return computed({
    get: () => page.value + 1,
    set: (value: number) => {
      page.value = Math.max(0, value - 1);
    },
  });
}
