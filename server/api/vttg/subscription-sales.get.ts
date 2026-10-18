import type { SubscriptionSalesSettings } from '#shared/types';

import {
  getSubscriptionSalesSettings,
  SUBSCRIPTION_SALES_DEFAULT_SETTINGS,
  SUBSCRIPTION_SALES_ERROR_LOG,
} from '#server/domain/subscription-sales';

/**
 * Включена ли оплата подписки. Роут публичный: его читает кнопка покупки у
 * каждого посетителя. Недоступное хранилище не прячет кнопку — оплата остаётся
 * в состоянии по умолчанию.
 */
export default defineEventHandler(
  async (): Promise<SubscriptionSalesSettings> => {
    try {
      return await getSubscriptionSalesSettings();
    } catch (error) {
      consola.error(SUBSCRIPTION_SALES_ERROR_LOG, error);

      return SUBSCRIPTION_SALES_DEFAULT_SETTINGS;
    }
  },
);
