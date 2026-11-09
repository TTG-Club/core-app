import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';
import {
  SUBSCRIPTION_EXTENSION_DAYS_MAX,
  SUBSCRIPTION_EXTENSION_DAYS_MIN,
} from '#shared/consts';

/** Ручка массового продления в subscriber-service. */
const SUBSCRIBER_EXTEND_ALL_PATH = '/api/admin/subscriptions/extend-all';

const extendAllBodySchema = z.object({
  days: z
    .number()
    .int()
    .min(SUBSCRIPTION_EXTENSION_DAYS_MIN)
    .max(SUBSCRIPTION_EXTENSION_DAYS_MAX),
  operationId: z.uuid(),
});

/**
 * Продлевает подписку всем, у кого она идёт прямо сейчас, на N дней. По
 * `operationId` subscriber-service не продлит второй раз при повторной
 * отправке. Только для администратора.
 */
export default defineEventHandler(async (event) => {
  const parsedBody = extendAllBodySchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return await fetchSubscriberAdminService<unknown>(
    event,
    SUBSCRIBER_EXTEND_ALL_PATH,
    { method: 'POST', body: parsedBody.data },
  );
});
