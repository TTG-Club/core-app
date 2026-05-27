import type { ComputedRef, Ref } from 'vue';

import type { BugCountByStatusResponse } from '../model';

import { BUG_REPORT_MY_COUNT_API_URL } from '../model';

/**
 * Описание возвращаемого значения композабла useMyBugsCount.
 */
export interface UseMyBugsCountReturn {
  /** Реактивное количество исправленных багов */
  fixedBugsCount: ComputedRef<number>;

  /** Состояние загрузки запроса */
  pending: Ref<boolean>;

  /** Ошибка выполнения запроса */
  error: Ref<unknown>;
}

/**
 * Композабл для получения количества исправленных баг-репортов текущего пользователя.
 *
 * Запрашивает статистику по статусам репортов авторизованного пользователя
 * и вычисляет количество репортов со статусом 'FIXED'.
 */
export function useMyBugsCount(): UseMyBugsCountReturn {
  const {
    data: countStats,
    pending,
    error,
  } = useFetch<BugCountByStatusResponse[]>(BUG_REPORT_MY_COUNT_API_URL, {
    lazy: true,
    server: false,
  });

  const fixedBugsCount = computed(() => {
    if (!countStats.value) {
      return 0;
    }

    const fixedStat = countStats.value.find(
      (statItem) => statItem.status === 'FIXED',
    );

    return fixedStat ? Number(fixedStat.count) : 0;
  });

  return {
    fixedBugsCount,
    pending,
    error,
  };
}
