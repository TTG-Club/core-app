import { fetchGameSystems } from '../model';

/** Общий ключ Nuxt-кэша: все карточки и формы используют один справочник. */
const GAME_SYSTEMS_DATA_KEY = 'find-game-systems';

/**
 * Загружает управляемый backend-справочник игровых систем.
 *
 * Один ключ `useAsyncData` разделяет результат между всеми потребителями на
 * странице и переносит SSR-результат в hydration payload без повторного
 * запроса в браузере.
 */
export function useGameSystems() {
  const { data: systems, status } = useAsyncData(
    GAME_SYSTEMS_DATA_KEY,
    fetchGameSystems,
    { deep: false, default: () => [] },
  );

  const systemItems = computed(() =>
    systems.value.map((system) => ({
      value: system.code,
      label: system.name,
    })),
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Возвращает отображаемое имя или сам код, пока справочник недоступен.
   * @param code Стабильный код системы, сохранённый в игре.
   */
  function getSystemName(code: string): string {
    return systems.value.find((system) => system.code === code)?.name ?? code;
  }

  return { systems, systemItems, isLoading, getSystemName };
}
