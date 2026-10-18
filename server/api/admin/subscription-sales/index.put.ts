import type { SubscriptionSalesSettings } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import { setSubscriptionSalesSettings } from '#server/domain/subscription-sales';
import { assertAdminRole } from '#server/utils/getUser';
import { subscriptionSalesSettingsSchema } from '#shared/utils';

/** Включает или выключает оплату подписки для всех. Только для администратора. */
export default defineEventHandler(
  async (event): Promise<SubscriptionSalesSettings> => {
    await assertAdminRole(event);

    const parsedBody = subscriptionSalesSettingsSchema.safeParse(
      await readBody<unknown>(event),
    );

    if (!parsedBody.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    return setSubscriptionSalesSettings(parsedBody.data);
  },
);
