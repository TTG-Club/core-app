import {
  useDocumentVisibility,
  useEventListener,
  useIntervalFn,
} from '@vueuse/core';

import {
  SUBSCRIPTION_POLL_COOLDOWN_MS,
  SUBSCRIPTION_POLL_INTERVAL_MS,
  SUBSCRIPTION_POLL_MAX_BACKOFF_MS,
} from '../model';
import { useMyRewards } from './useMyRewards';
import { useMySubscriptions } from './useMySubscriptions';

/**
 * Держит статус подписки/перки актуальными без F5: по таймеру и при возврате на
 * вкладку/окно обновляет «живые» данные — статус подписки и перки (блок статуса
 * вверху профиля и бейдж/значок/цвет ника в сайдбаре). Обновление «тихое»: данные
 * шарятся по ключу useAsyncData и не показывают индикатор загрузки на фоновом
 * опросе (см. isInitialLoading). Список кодов фоном не опрашивается.
 *
 * Защита от самоограничения по rate-limit (чтобы фронт сам себя не ронял в 429):
 * - таймер ПАУЗИТСЯ на скрытой вкладке (Page Visibility) — оставленная в фоне
 *   вкладка не шлёт запросы; при возврате обновляемся разово;
 * - cooldown между любыми обновлениями — серия focus/visibility не выдаёт пачку;
 * - single-flight — не запускаем новый опрос, пока не завершился предыдущий;
 * - на 429 включается экспоненциальный backoff (до потолка) — пока сервер
 *   лимитирует, опрашиваем реже; успех сбрасывает backoff;
 * - сами запросы идут с retry: 0 (см. useMySubscriptions/useMyRewards), чтобы
 *   ofetch не удваивал их авто-ретраем на 429.
 *
 * Вызывать один раз на странице профиля (в сайдбаре), чтобы был один таймер на раздел.
 */
export function useSubscriptionAutoRefresh() {
  const { refresh: refreshSubscriptions, error: subscriptionsError } =
    useMySubscriptions();

  const { refresh: refreshRewards, error: rewardsError } = useMyRewards();

  async function refreshSubscriptionData(): Promise<void> {
    await Promise.all([refreshSubscriptions(), refreshRewards()]);
  }

  if (import.meta.client) {
    const visibility = useDocumentVisibility();

    // Опрос идёт через «затвор» nextAllowedAt — он держит и cooldown, и backoff.
    let inFlight = false;
    let nextAllowedAt = 0;
    let backoffMs = 0;

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

    async function runRefresh(): Promise<void> {
      // Скрытую вкладку не опрашиваем ни по одному триггеру (таймер/focus/visibility):
      // как в online-heartbeat, проверку видимости держим на всех путях обновления —
      // focus может прийти, пока вкладка ещё hidden (гонка с visibilitychange).
      if (
        visibility.value === 'hidden'
        || inFlight
        || Date.now() < nextAllowedAt
      ) {
        return;
      }

      inFlight = true;

      try {
        await refreshSubscriptionData();
      } catch {
        // refresh() обычно не бросает (ошибку кладёт в error ref) — глотаем,
        // фактический статус читаем из error ref ниже.
      } finally {
        inFlight = false;

        // Статус берём из error ref (а не из ветки try/catch): backoff сработает
        // и когда refresh проглотил ошибку в ref, и когда отклонил промис.
        if (
          isRateLimited(subscriptionsError.value)
          || isRateLimited(rewardsError.value)
        ) {
          // Экспоненциальный backoff: пока держится лимит — стучимся всё реже.
          backoffMs = Math.min(
            backoffMs ? backoffMs * 2 : SUBSCRIPTION_POLL_INTERVAL_MS,
            SUBSCRIPTION_POLL_MAX_BACKOFF_MS,
          );

          nextAllowedAt = Date.now() + backoffMs;
        } else {
          backoffMs = 0;
          nextAllowedAt = Date.now() + SUBSCRIPTION_POLL_COOLDOWN_MS;
        }
      }
    }

    const { pause, resume } = useIntervalFn(
      () => {
        void runRefresh();
      },
      SUBSCRIPTION_POLL_INTERVAL_MS,
      { immediate: false },
    );

    // Пауза на скрытой вкладке; при возврате — рестарт таймера и разовое обновление.
    watch(visibility, (state) => {
      if (state === 'visible') {
        resume();
        void runRefresh();
      } else {
        pause();
      }
    });

    // Возврат фокуса в окно (когда вкладка уже была видимой) — тоже повод обновиться.
    useEventListener(window, 'focus', () => {
      void runRefresh();
    });

    onMounted(() => {
      if (visibility.value !== 'hidden') {
        resume();
      }
    });
  }

  return { refreshSubscriptionData };
}
