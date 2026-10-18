import type { SubscriptionSalesSettings } from '../types/subscription-sales';

import { z } from 'zod';

/**
 * Схема настройки продажи подписки. Одна на обе стороны: сервер проверяет ей
 * JSON из хранилища и тело запроса админки, клиент — ответ API.
 */
export const subscriptionSalesSettingsSchema: z.ZodType<SubscriptionSalesSettings> =
  z.object({
    enabled: z.boolean(),
  });
