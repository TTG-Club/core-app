import {
  SUBSCRIPTION_LIVE_DATA_KEYS,
  SUBSCRIPTION_POLL_INTERVAL_MS,
} from '../model';

/**
 * Держит статус подписки/перки актуальными без F5: по таймеру и при возврате на
 * вкладку (focus/visibilitychange) обновляет «живые» ключи — статус подписки и перки
 * (блок статуса вверху профиля и бейдж/значок/цвет ника в сайдбаре). Обновление
 * «тихое»: данные шарятся по ключу useAsyncData и не показывают индикатор загрузки
 * на фоновом опросе (см. isInitialLoading). Список кодов фоном не опрашивается.
 * Вызывать один раз на странице профиля (в сайдбаре), чтобы был один таймер на раздел.
 */
export function useSubscriptionAutoRefresh() {
  function refreshSubscriptionData(): Promise<void> {
    return refreshNuxtData(SUBSCRIPTION_LIVE_DATA_KEYS);
  }

  if (import.meta.client) {
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    function onFocus(): void {
      void refreshSubscriptionData();
    }

    function onVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        void refreshSubscriptionData();
      }
    }

    onMounted(() => {
      pollTimer = setInterval(() => {
        void refreshSubscriptionData();
      }, SUBSCRIPTION_POLL_INTERVAL_MS);

      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('focus', onFocus);
    });

    onBeforeUnmount(() => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }

      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    });
  }

  return { refreshSubscriptionData };
}
