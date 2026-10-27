import type { SubscriptionPaymentParams } from '../model';

import { FetchError } from 'ofetch';
import { z } from 'zod';

import { PRIVACY_POLICY_UPDATED_AT } from '~infrastructure/privacy-policy/model';
import { PUBLIC_OFFER_UPDATED_AT } from '~infrastructure/public-offer/model';

import {
  SUBSCRIPTION_CONSENTS_API_PATH,
  SUBSCRIPTION_PAYMENT_API_PATH,
  subscriptionPaymentSchema,
  VTTG_SUBSCRIPTION_PURCHASE_TEXT,
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

  return VTTG_SUBSCRIPTION_PURCHASE_TEXT.errorFallback;
}

/**
 * Сохраняет в auth-service согласия с действующими редакциями оферты и политики.
 */
async function acceptConsents(): Promise<void> {
  await $fetch(SUBSCRIPTION_CONSENTS_API_PATH, {
    method: 'POST',
    body: {
      offerAccepted: true,
      offerVersion: PUBLIC_OFFER_UPDATED_AT,
      personalDataConsent: true,
      privacyPolicyVersion: PRIVACY_POLICY_UPDATED_AT,
    },
  });
}

/**
 * Оплата подписки: при необходимости сохраняет согласия, затем создаёт платёж в subscriber-service за выбранное число месяцев
 * (без автопродления) и уводит пользователя на платёжную форму PayAnyWay. Пока идёт
 * переход, кнопка остаётся в состоянии загрузки.
 */
export function useSubscriptionPayment() {
  const toast = useToast();
  const isPending = ref(false);

  async function startPayment({
    months,
    email,
    acceptConsents: needsConsents,
  }: SubscriptionPaymentParams): Promise<void> {
    if (isPending.value) {
      return;
    }

    isPending.value = true;

    try {
      if (needsConsents) {
        await acceptConsents();
      }

      const payment = subscriptionPaymentSchema.parse(
        await $fetch<unknown>(SUBSCRIPTION_PAYMENT_API_PATH, {
          method: 'POST',
          body: { months, email },
        }),
      );

      await navigateTo(payment.paymentUrl, { external: true });
    } catch (error) {
      isPending.value = false;

      toast.add({
        title: VTTG_SUBSCRIPTION_PURCHASE_TEXT.errorTitle,
        description: getPaymentErrorMessage(error),
        color: 'error',
      });
    }
  }

  return { isPending, startPayment };
}
