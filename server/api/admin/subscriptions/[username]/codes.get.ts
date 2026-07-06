import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { fetchSubscriberAdminService } from '#server/utils/subscriberAdminService';

const usernameParamsSchema = z.object({
  username: z.string().min(1),
});

/**
 * Возвращает промокоды, погашённые пользователем, для админ-панели.
 * Проксирует GET /api/admin/subscriptions/{username}/codes в subscriber-service,
 * предварительно проверяя права администратора. Неизвестный пользователь → [].
 */
export default defineEventHandler(async (event) => {
  const parsedParams = usernameParamsSchema.safeParse(getRouterParams(event));

  if (!parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const username = encodeURIComponent(parsedParams.data.username);

  return await fetchSubscriberAdminService<unknown>(
    event,
    `/api/admin/subscriptions/${username}/codes`,
  );
});
