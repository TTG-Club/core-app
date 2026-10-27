import type { PendingReview } from '../model';

import { fetchPendingReviews, PENDING_REVIEWS_DATA_KEY } from '../model';

/**
 * Игры, где пользователь ещё не оценил тех, с кем играл.
 *
 * Ключ данных общий: сводка «Моих игр» и окно оценки делят один запрос, и
 * сохранённая оценка убирает игру из списка без перезагрузки страницы.
 * Выдача личная и грузится только в браузере.
 */
export function usePendingReviews() {
  const {
    data: pendingReviews,
    error,
    status,
    refresh,
  } = useAsyncData(PENDING_REVIEWS_DATA_KEY, fetchPendingReviews, {
    server: false,
    deep: false,
    default: (): Array<PendingReview> => [],
  });

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  return {
    pendingReviews,
    error,
    isLoading,
    refresh,
  };
}
