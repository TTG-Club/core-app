import {
  SUBSCRIPTION_POLL_COOLDOWN_MS,
  SUBSCRIPTION_POLL_INTERVAL_MS,
  SUBSCRIPTION_POLL_MAX_BACKOFF_MS,
} from '../model';
import { useMyRewards } from './useMyRewards';
import { useMySubscriptions } from './useMySubscriptions';

/**
 * Ответил ли сервер отказом по rate-limit (429).
 *
 * @param error Ошибка запроса из `error` ref соответствующего useAsyncData.
 */
function isRateLimited(error: unknown): boolean {
  const err = error as
    | {
        statusCode?: number;
        status?: number;
        response?: { status?: number };
      }
    | null
    | undefined;

  return (
    err?.statusCode === 429
    || err?.status === 429
    || err?.response?.status === 429
  );
}

/**
 * Держит статус подписки/перки актуальными без F5: по таймеру и при возврате на
 * вкладку/окно обновляет «живые» данные — статус подписки и перки (блок статуса
 * вверху профиля и бейдж/значок/цвет ника в сайдбаре). Обновление «тихое»: данные
 * шарятся по ключу useAsyncData и не показывают индикатор загрузки на фоновом
 * опросе (см. isInitialLoading). Список кодов фоном не опрашивается.
 *
 * Гигиена опроса (пауза на скрытой вкладке, cooldown, single-flight,
 * экспоненциальный backoff) вынесена в `useBackgroundRefresh` — здесь остаётся
 * только условие backoff: на 429 опрашиваем реже, чтобы фронт сам себя не ронял
 * в rate-limit. Сами запросы идут с retry: 0 (см. useMySubscriptions/
 * useMyRewards), чтобы ofetch не удваивал их авто-ретраем на 429.
 *
 * Вызывать один раз на странице профиля (в сайдбаре), чтобы был один таймер на раздел.
 */
export function useSubscriptionAutoRefresh(): void {
  const { refresh: refreshSubscriptions, error: subscriptionsError } =
    useMySubscriptions();

  const { refresh: refreshRewards, error: rewardsError } = useMyRewards();

  async function refreshSubscriptionData(): Promise<void> {
    await Promise.all([refreshSubscriptions(), refreshRewards()]);
  }

  useBackgroundRefresh({
    refresh: refreshSubscriptionData,
    // Статус берём из error ref (а не из try/catch): backoff сработает и когда
    // refresh проглотил ошибку в ref, и когда отклонил промис.
    shouldBackoff: () =>
      isRateLimited(subscriptionsError.value)
      || isRateLimited(rewardsError.value),
    intervalMs: SUBSCRIPTION_POLL_INTERVAL_MS,
    cooldownMs: SUBSCRIPTION_POLL_COOLDOWN_MS,
    maxBackoffMs: SUBSCRIPTION_POLL_MAX_BACKOFF_MS,
  });
}
