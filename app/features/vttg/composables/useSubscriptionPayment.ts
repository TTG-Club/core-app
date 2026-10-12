import { FetchError } from 'ofetch';
import { z } from 'zod';

import {
  SUBSCRIPTION_PAYMENT_API_PATH,
  subscriptionPaymentSchema,
  VTTG_SUBSCRIPTION_PAYMENT_TEXT,
} from '../model';

/**
 * Достаёт из ошибки запроса понятное пользователю сообщение.
 */
function getPaymentErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    const parsed = z.object({ message: z.string() }).safeParse(error.data);

    if (parsed.success && parsed.data.message) {
      return parsed.data.message;
    }
  }

  return VTTG_SUBSCRIPTION_PAYMENT_TEXT.errorFallback;
}

/**
 * Оплата подписки: создаёт платёж в subscriber-service и уводит пользователя на
 * платёжную форму PayAnyWay. Пока идёт переход, кнопка остаётся в состоянии загрузки.
 */
export function useSubscriptionPayment() {
  const toast = useToast();
  const isPending = ref(false);

  async function startPayment(): Promise<void> {
    if (isPending.value) {
      return;
    }

    isPending.value = true;

    try {
      const payment = subscriptionPaymentSchema.parse(
        await $fetch<unknown>(SUBSCRIPTION_PAYMENT_API_PATH, {
          method: 'POST',
        }),
      );

      await navigateTo(payment.paymentUrl, { external: true });
    } catch (error) {
      isPending.value = false;

      toast.add({
        title: VTTG_SUBSCRIPTION_PAYMENT_TEXT.errorTitle,
        description: getPaymentErrorMessage(error),
        color: 'error',
      });
    }
  }

  return { isPending, startPayment };
}
