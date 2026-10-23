import { useMySubscriptions } from './useMySubscriptions';

/**
 * Можно ли предлагать текущему пользователю оформить подписку: статус уже
 * загружен и активной подписки нет. Пока статус грузится, предложение не
 * показываем, иначе у подписчика ссылка мелькнёт и исчезнет.
 */
export function useSubscriptionOffer() {
  const { subscriptions, status } = useMySubscriptions();

  const canOfferSubscription = computed(
    () =>
      status.value === 'success'
      && !subscriptions.value.some(
        (subscription) => subscription.status === 'ACTIVE',
      ),
  );

  return { canOfferSubscription };
}
