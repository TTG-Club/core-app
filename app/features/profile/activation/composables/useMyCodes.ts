import type { MyRedemption } from '../model';

import {
  SUBSCRIPTION_MY_CODES_API_PATH,
  SUBSCRIPTION_MY_CODES_DATA_KEY,
} from '../model';

/**
 * Список кодов, погашенных текущим пользователем (GET /api/subscriptions/my-codes).
 * Общий ключ — данные шарятся между разделом «Активация кодов» и блоком подписки
 * на главной профиля; после погашения/активации вызывать refresh().
 */
export function useMyCodes() {
  const requestFetch = useRequestFetch();

  // server: false — приватные данные пользователя грузим на клиенте, где авторизация
  // (cookie → Bearer → subscriber) гарантированно работает. На SSR этот запрос
  // возвращался пустым, и Nuxt переиспользовал пустой payload после F5.
  const { data, status, error, refresh } = useAsyncData<MyRedemption[]>(
    SUBSCRIPTION_MY_CODES_DATA_KEY,
    () => requestFetch(SUBSCRIPTION_MY_CODES_API_PATH),
    { default: () => [], server: false },
  );

  const isLoading = computed(() => status.value === 'pending');

  return { codes: data, status, isLoading, error, refresh };
}
