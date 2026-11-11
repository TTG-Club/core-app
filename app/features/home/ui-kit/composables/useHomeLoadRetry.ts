import type { MaybeRefOrGetter } from 'vue';

import type { AsyncDataRequestStatus } from '#app';

import { HOME_LOAD_RETRY_DELAYS_MS } from '../model';

/**
 * Автоповтор упавшего запроса блока главной.
 *
 * Главную держат открытой подолгу, и разовый сбой (сеть, 429 от лимитера,
 * 5xx) не должен оставлять блок пустым до F5. После ошибки запрос повторяется
 * с растущей паузой; на скрытой вкладке повтор откладывается до возврата на
 * неё. Успех сбрасывает счётчик.
 *
 * @returns `retryNow` — ручной повтор (кнопка в заглушке), сбрасывает паузу
 */
export function useHomeLoadRetry(
  status: MaybeRefOrGetter<AsyncDataRequestStatus>,
  refresh: () => Promise<unknown>,
) {
  const visibility = useDocumentVisibility();

  let timer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;

  /** Срок повтора прошёл, пока вкладка была скрыта */
  let isRetryDeferred = false;

  function clearTimer(): void {
    if (timer === undefined) {
      return;
    }

    clearTimeout(timer);
    timer = undefined;
  }

  function runRetry(): void {
    attempt += 1;
    refresh();
  }

  watch(
    () => toValue(status),
    (state) => {
      if (state === 'success') {
        attempt = 0;
        isRetryDeferred = false;
        clearTimer();

        return;
      }

      if (state !== 'error' || timer !== undefined) {
        return;
      }

      const delay =
        HOME_LOAD_RETRY_DELAYS_MS[
          Math.min(attempt, HOME_LOAD_RETRY_DELAYS_MS.length - 1)
        ];

      timer = setTimeout(() => {
        timer = undefined;

        if (visibility.value === 'hidden') {
          isRetryDeferred = true;

          return;
        }

        runRetry();
      }, delay);
    },
    { immediate: true },
  );

  watch(visibility, (state) => {
    if (state !== 'visible' || !isRetryDeferred) {
      return;
    }

    isRetryDeferred = false;
    runRetry();
  });

  onScopeDispose(clearTimer);

  function retryNow(): void {
    clearTimer();
    isRetryDeferred = false;
    attempt = 0;
    refresh();
  }

  return { retryNow };
}
