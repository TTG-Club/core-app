import {
  getExpiringSubscription,
  getSubscriptionExpiryDismissMark,
  SUBSCRIPTION_EXPIRY_CLOCK_INTERVAL,
  SUBSCRIPTION_EXPIRY_DISMISS_DAY_FORMAT,
  SUBSCRIPTION_EXPIRY_DISMISSED_STORAGE_KEY,
} from '../model';
import { useCachedSubscriptions } from './useCachedSubscriptions';

/**
 * Подписка текущего пользователя, срок которой подходит к концу, — для плашки
 * с напоминанием о продлении. Своего запроса не делает (см.
 * `useCachedSubscriptions`); часы обновляются раз в час, чтобы остаток дней и
 * смена суток не застывали на долго открытой вкладке.
 *
 * `dismiss` пишет в браузерное хранилище отметку о закрытии: напоминание
 * скрыто до конца суток, назавтра появится снова.
 */
export function useExpiringSubscription() {
  const { format } = useDayjs();

  const subscriptions = useCachedSubscriptions();

  const now = useNow({ interval: SUBSCRIPTION_EXPIRY_CLOCK_INTERVAL });

  const dismissMark = useLocalStorage(
    SUBSCRIPTION_EXPIRY_DISMISSED_STORAGE_KEY,
    '',
  );

  const expiringByDate = computed(() =>
    getExpiringSubscription(subscriptions.value, now.value.getTime()),
  );

  /** Отметка, которую оставило бы закрытие сейчас. */
  const todayMark = computed(() =>
    expiringByDate.value
      ? getSubscriptionExpiryDismissMark(
          expiringByDate.value.expiresAt,
          format(now.value, SUBSCRIPTION_EXPIRY_DISMISS_DAY_FORMAT),
        )
      : undefined,
  );

  const expiringSubscription = computed(() =>
    todayMark.value === dismissMark.value ? undefined : expiringByDate.value,
  );

  /** Скрывает напоминание до конца суток. */
  function dismiss(): void {
    if (todayMark.value) {
      dismissMark.value = todayMark.value;
    }
  }

  return { expiringSubscription, dismiss };
}
