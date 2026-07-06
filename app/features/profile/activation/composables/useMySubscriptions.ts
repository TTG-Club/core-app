import type { Subscription } from '../model';

import { SUBSCRIPTION_MY_API_PATH, SUBSCRIPTION_MY_DATA_KEY } from '../model';

/**
 * Подписки текущего пользователя (GET /api/subscriptions/my) — авторитетный источник
 * статуса подписки для главной профиля: возвращает все подписки независимо от того,
 * привязан ли к ним код-источник. После активации вызывать refresh().
 */
export function useMySubscriptions() {
  const requestFetch = useRequestFetch();

  // server: false — приватные данные пользователя грузим на клиенте, где авторизация
  // (cookie → Bearer → subscriber) гарантированно работает. На SSR этот запрос
  // возвращался пустым, и Nuxt переиспользовал пустой payload после F5.
  // retry: 0 — фоновый опрос не должен удваиваться авто-ретраем ofetch (в т.ч. на
  // 429), иначе при rate-limit мы сами усиливаем нагрузку. См. useSubscriptionAutoRefresh.
  const { data, status, error, refresh } = useAsyncData<Subscription[]>(
    SUBSCRIPTION_MY_DATA_KEY,
    () => requestFetch(SUBSCRIPTION_MY_API_PATH, { retry: 0 }),
    { default: () => [], server: false },
  );

  const isLoading = computed(() => status.value === 'pending');

  // Первая загрузка завершена? После неё фоновый опрос обновляет данные «тихо»,
  // без «Загрузка…» — индикатор показываем только при самой первой загрузке
  // (stale-while-revalidate), иначе UI дёргается каждые 30 с.
  const hasLoadedOnce = ref(false);

  watch(
    status,
    (value) => {
      if (value === 'success' || value === 'error') {
        hasLoadedOnce.value = true;
      }
    },
    { immediate: true },
  );

  const isInitialLoading = computed(
    () => status.value === 'pending' && !hasLoadedOnce.value,
  );

  return {
    subscriptions: data,
    status,
    isLoading,
    isInitialLoading,
    error,
    refresh,
  };
}
