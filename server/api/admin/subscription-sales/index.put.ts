import type { SubscriptionSalesSettings } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';
import { subscriptionSalesSettingsSchema } from '#shared/utils';

/** Ручка выключателя оплаты в subscriber-service. */
const SUBSCRIBER_SALES_ADMIN_PATH = '/api/admin/payments/availability';

/**
 * Включает или выключает оплату подписки для всех. Выключатель живёт в
 * subscriber-service: он же и не создаёт платежи, пока оплата выключена, —
 * даже на запрос в обход сайта. Только для администратора.
 */
export default defineEventHandler(
  async (event): Promise<SubscriptionSalesSettings> => {
    const parsedBody = subscriptionSalesSettingsSchema.safeParse(
      await readBody<unknown>(event),
    );

    if (!parsedBody.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    return subscriptionSalesSettingsSchema.parse(
      await fetchSubscriberAdminService<unknown>(
        event,
        SUBSCRIBER_SALES_ADMIN_PATH,
        { method: 'PUT', body: parsedBody.data },
      ),
    );
  },
);
