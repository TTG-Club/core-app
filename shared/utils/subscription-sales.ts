import type { SubscriptionSalesSettings } from '../types/subscription-sales';

import { z } from 'zod';

/**
 * Схема состояния оплаты подписки. Одна на обе стороны: сервер проверяет ей
 * тело запроса админки и ответ subscriber-service, клиент — ответ API.
 */
export const subscriptionSalesSettingsSchema: z.ZodType<SubscriptionSalesSettings> =
  z.object({
    enabled: z.boolean(),
  });
