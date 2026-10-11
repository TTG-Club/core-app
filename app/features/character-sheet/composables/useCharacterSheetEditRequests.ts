import type { ComputedRef } from 'vue';

import { createSharedComposable } from '@vueuse/core';

import {
  fetchIncomingEditRequestCount,
  SHEET_EDIT_REQUESTS_DATA_KEY,
  SHEET_EDIT_REQUESTS_POLL_COOLDOWN_MS,
  SHEET_EDIT_REQUESTS_POLL_INTERVAL_MS,
  SHEET_EDIT_REQUESTS_POLL_MAX_BACKOFF_MS,
} from '../model';

/** Описание возвращаемого значения композабла useCharacterSheetEditRequests. */
export interface UseCharacterSheetEditRequestsReturn {
  /** Неотвеченные запросы на редактирование активных листов пользователя. */
  count: ComputedRef<number>;

  /** Есть ли запросы, ждущие ответа (точка у шлема). */
  hasRequests: ComputedRef<boolean>;

  /** Перечитать сводку сразу — после решения владельца по запросу. */
  refresh: () => Promise<void>;
}

/**
 * Сводка входящих запросов на редактирование листов: точка у шлема и в его
 * меню, а для открытого листа и списка — сигнал «пора перечитать запросы».
 *
 * Обёрнут в `createSharedComposable`: потребителей несколько (меню шлема, лист,
 * список), а таймер опроса должен быть один. Состояние живёт, пока смонтирован
 * хотя бы один потребитель. Анониму сводку не запрашиваем: лист по ссылке
 * открывают и без входа, а ручка закрыта авторизацией.
 *
 * @returns число запросов, признак их наличия и ручное обновление.
 */
function createCharacterSheetEditRequests(): UseCharacterSheetEditRequestsReturn {
  const { isLoggedIn } = useUser();

  // server: false — приватные данные пользователя грузим на клиенте, где
  // авторизация (cookie → Bearer) гарантированно работает. Вход и выход
  // перечитывают сводку сами: точка не должна ждать следующего опроса.
  const { data, error, refresh } = useAsyncData<number>(
    SHEET_EDIT_REQUESTS_DATA_KEY,
    () =>
      isLoggedIn.value ? fetchIncomingEditRequestCount() : Promise.resolve(0),
    { server: false, watch: [isLoggedIn] },
  );

  const count = computed(() => data.value ?? 0);

  const hasRequests = computed(() => count.value > 0);

  // Опрос сводки: точка зажигается без перезагрузки страницы.
  useBackgroundRefresh({
    refresh: () => refresh(),
    shouldBackoff: () => !!error.value,
    intervalMs: SHEET_EDIT_REQUESTS_POLL_INTERVAL_MS,
    cooldownMs: SHEET_EDIT_REQUESTS_POLL_COOLDOWN_MS,
    maxBackoffMs: SHEET_EDIT_REQUESTS_POLL_MAX_BACKOFF_MS,
  });

  return {
    count,
    hasRequests,
    refresh: () => refresh(),
  };
}

export const useCharacterSheetEditRequests = createSharedComposable(
  createCharacterSheetEditRequests,
);
