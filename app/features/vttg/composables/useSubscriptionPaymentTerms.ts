import type { SubscriptionPaymentTerms } from '../model';

import {
  SUBSCRIPTION_PAYMENT_TERMS_API_PATH,
  subscriptionPaymentTermsSchema,
  VTTG_SUBSCRIPTION_PURCHASE_TEXT,
} from '../model';

/**
 * Условия оплаты подписки из subscriber-service: цена месяца, предел срока и
 * скидки. Кнопка покупки грузит их до открытия окна, чтобы окно появилось уже
 * с ценой; ответ проверяется схемой, ошибка показывается тостом.
 */
export function useSubscriptionPaymentTerms() {
  const toast = useToast();
  const isLoading = ref(false);

  /** Загружает условия; при ошибке показывает тост и возвращает null. */
  async function load(): Promise<SubscriptionPaymentTerms | null> {
    isLoading.value = true;

    try {
      return subscriptionPaymentTermsSchema.parse(
        await $fetch<unknown>(SUBSCRIPTION_PAYMENT_TERMS_API_PATH),
      );
    } catch {
      toast.add({
        title: VTTG_SUBSCRIPTION_PURCHASE_TEXT.errorTitle,
        description: VTTG_SUBSCRIPTION_PURCHASE_TEXT.termsError,
        color: 'error',
      });

      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, load };
}
