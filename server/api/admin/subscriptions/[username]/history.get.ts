import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';

const usernameParamsSchema = z.object({
  username: z.string().min(1),
});

/**
 * Возвращает историю подписки пользователя для админ-панели: оплаты, выдачи и
 * отключения администратором, промокоды. Проксирует
 * GET /api/admin/subscriptions/{username}/history в subscriber-service,
 * предварительно проверяя права администратора.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = usernameParamsSchema.safeParse(getRouterParams(event));

  if (!parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const username = encodeURIComponent(parsedParams.data.username);

  return await fetchSubscriberAdminService<unknown>(
    event,
    `/api/admin/subscriptions/${username}/history`,
  );
});
