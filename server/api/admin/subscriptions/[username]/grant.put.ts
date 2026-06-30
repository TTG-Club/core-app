import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import {
  fetchSubscriberAdminService,
  parseAdminSubscriptionResponse,
} from '#server/utils/subscriberAdminService';

const usernameParamsSchema = z.object({
  username: z.string().min(1),
});

const grantBodySchema = z.object({
  months: z.number().int().min(1).max(120),
});

/**
 * Выдаёт пользователю подписку на N месяцев (PUT .../grant) через subscriber-service.
 * Ручка subscriber-service сразу возвращает актуальный сводный статус подписки.
 * Доступно только администратору.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = usernameParamsSchema.safeParse(getRouterParams(event));
  const parsedBody = grantBodySchema.safeParse(await readBody<unknown>(event));

  if (!parsedParams.success || !parsedBody.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const username = encodeURIComponent(parsedParams.data.username);

  return parseAdminSubscriptionResponse(
    await fetchSubscriberAdminService<unknown>(
      event,
      `/api/admin/subscriptions/${username}/grant`,
      {
        method: 'PUT',
        body: { months: parsedBody.data.months },
      },
    ),
  );
});
