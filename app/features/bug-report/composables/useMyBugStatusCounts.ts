import type { Ref } from 'vue';

import type { BugCountByStatusResponse, BugReportType } from '../model';

import { createSharedComposable } from '@vueuse/core';

import {
  BUG_REPORT_MY_COUNT_API_URL,
  MY_BUGS_STATUS_COUNTS_DATA_KEY,
} from '../model';

/** Описание возвращаемого значения композабла useMyBugStatusCounts. */
export interface UseMyBugStatusCountsReturn {
  /** Количество баг-репортов пользователя в разрезе статусов */
  statusCounts: Ref<BugCountByStatusResponse[]>;

  /** Перечитать сводку */
  refresh: () => Promise<void>;
}

/**
 * Сводка «сколько моих баг-репортов в каждом статусе» — только баги, без
 * пожеланий: по ней считается плитка исправленных багов, а пожелания в
 * зачёт багхантера не идут. Сводку пожеланий раздел профиля спрашивает сам.
 *
 * Единственный источник для всех потребителей: плитки-фильтры в разделе
 * профиля и плитка исправленных багов в сайдбаре спрашивали одну и ту же ручку
 * порознь и на странице профиля дублировали запрос.
 *
 * Обёрнут в `createSharedComposable`: одного общего ключа `useAsyncData` мало —
 * он шарит данные, но первый запрос запускает каждый экземпляр отдельно.
 */
function createMyBugStatusCounts(): UseMyBugStatusCountsReturn {
  const requestFetch = useRequestFetch();

  // server: false — приватные данные пользователя грузим на клиенте, где
  // авторизация (cookie → Bearer → микросервис) гарантированно работает.
  const { data, refresh } = useAsyncData<BugCountByStatusResponse[]>(
    MY_BUGS_STATUS_COUNTS_DATA_KEY,
    () =>
      requestFetch(BUG_REPORT_MY_COUNT_API_URL, {
        query: { type: 'BUG' satisfies BugReportType },
      }),
    { default: () => [], server: false },
  );

  return { statusCounts: data, refresh };
}

export const useMyBugStatusCounts = createSharedComposable(
  createMyBugStatusCounts,
);
