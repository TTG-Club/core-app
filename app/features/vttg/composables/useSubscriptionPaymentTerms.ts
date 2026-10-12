import {
  SUBSCRIPTION_PAYMENT_TERMS_API_PATH,
  SUBSCRIPTION_PAYMENT_TERMS_DATA_KEY,
  subscriptionPaymentTermsSchema,
} from '../model';

/**
 * Условия оплаты подписки из subscriber-service: цена месяца и предел срока.
 * Грузятся в браузере при открытии окна покупки, ответ проверяется схемой.
 */
export function useSubscriptionPaymentTerms() {
  return useAsyncData(
    SUBSCRIPTION_PAYMENT_TERMS_DATA_KEY,
    async () =>
      subscriptionPaymentTermsSchema.parse(
        await $fetch<unknown>(SUBSCRIPTION_PAYMENT_TERMS_API_PATH),
      ),
    { server: false },
  );
}
