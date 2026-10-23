import type { Subscription } from '../model';

import { SUBSCRIPTION_MY_DATA_KEY } from '../model';

/**
 * Подписки текущего пользователя без своего запроса: список по общему ключу,
 * который у каждого вошедшего грузит меню пользователя (`useProfileBadges`).
 * У гостя данных нет — список пустой.
 */
export function useCachedSubscriptions() {
  const { data } = useNuxtData<Array<Subscription>>(SUBSCRIPTION_MY_DATA_KEY);

  return computed<ReadonlyArray<Subscription>>(() => data.value ?? []);
}
