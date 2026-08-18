import type { ComputedRef } from 'vue';

import { useMyBugStatusCounts } from './useMyBugStatusCounts';

/**
 * Описание возвращаемого значения композабла useMyBugsCount.
 */
export interface UseMyBugsCountReturn {
  /** Реактивное количество исправленных багов */
  fixedBugsCount: ComputedRef<number>;
}

/**
 * Количество исправленных баг-репортов текущего пользователя.
 *
 * Считается из общей сводки по статусам (`useMyBugStatusCounts`), а не своим
 * запросом: на странице профиля ту же ручку спрашивает раздел «Мои
 * баг-репорты», и раньше запрос уходил дважды.
 */
export function useMyBugsCount(): UseMyBugsCountReturn {
  const { statusCounts } = useMyBugStatusCounts();

  const fixedBugsCount = computed(() => {
    const fixedStat = statusCounts.value.find(
      (statItem) => statItem.status === 'FIXED',
    );

    return fixedStat ? Number(fixedStat.count) : 0;
  });

  return { fixedBugsCount };
}
