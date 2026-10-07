import { fetchGenres, GAME_GENRES_DATA_KEY } from '../model';

/**
 * Загружает список жанров из сервиса.
 *
 * Список короткий и готовый, поэтому приходит целиком: форма выбирает из него
 * без поиска на сервисе, а фильтр каталога строит по нему группу «Жанры».
 * Один ключ `useAsyncData` разделяет результат между потребителями на странице
 * и переносит SSR-результат в hydration payload без повторного запроса.
 */
export function useGameGenres() {
  const { data: genres, status } = useAsyncData(
    GAME_GENRES_DATA_KEY,
    fetchGenres,
    { deep: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  return { genres, isLoading };
}
