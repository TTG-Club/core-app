import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import {
  fetchSubscriberAdminService,
  parseAdminSubscriptionResponse,
} from '#server/utils/subscriberAdminService';

const usernameParamsSchema = z.object({
  username: z.string().min(1),
});

/**
 * Отзывает (отключает) подписку пользователя (DELETE .../{username}) через
 * subscriber-service. Ручка subscriber-service сразу возвращает актуальный сводный
 * статус подписки. Доступно только администратору.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = usernameParamsSchema.safeParse(getRouterParams(event));

  if (!parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const username = encodeURIComponent(parsedParams.data.username);

  return parseAdminSubscriptionResponse(
    await fetchSubscriberAdminService<unknown>(
      event,
      `/api/admin/subscriptions/${username}`,
      {
        method: 'DELETE',
      },
    ),
  );
});
