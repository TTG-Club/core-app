import { hasActiveSubscription } from '../model';
import { useCachedSubscriptions } from './useCachedSubscriptions';

/**
 * Активна ли подписка у текущего пользователя — для подсказок у лимитов.
 * Своего запроса не делает (см. `useCachedSubscriptions`); у гостя ответ —
 * «нет подписки».
 */
export function useIsSubscriber() {
  const subscriptions = useCachedSubscriptions();

  return computed(() => hasActiveSubscription(subscriptions.value));
}
