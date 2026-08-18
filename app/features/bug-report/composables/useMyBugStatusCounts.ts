import type { Ref } from 'vue';

import type { BugCountByStatusResponse } from '../model';

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
 * Сводка «сколько моих баг-репортов в каждом статусе».
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
    () => requestFetch(BUG_REPORT_MY_COUNT_API_URL),
    { default: () => [], server: false },
  );

  return { statusCounts: data, refresh };
}

export const useMyBugStatusCounts = createSharedComposable(
  createMyBugStatusCounts,
);
