import type { Subscription } from '../model';

import { hasActiveSubscription, SUBSCRIPTION_MY_DATA_KEY } from '../model';

/**
 * Активна ли подписка у текущего пользователя — для подсказок у лимитов.
 *
 * Своего запроса не делает: читает список подписок по общему ключу, который
 * у каждого вошедшего грузит меню пользователя (`useProfileBadges`). У гостя
 * данных нет, и ответ — «нет подписки».
 */
export function useIsSubscriber() {
  const { data } = useNuxtData<Array<Subscription>>(SUBSCRIPTION_MY_DATA_KEY);

  return computed(() => hasActiveSubscription(data.value ?? []));
}
