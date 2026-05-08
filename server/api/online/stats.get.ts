import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { fetchOnlineService, getOnlineSiteId } from '#server/domain/online';

const onlineStatsQuerySchema = z.object({
  windowMinutes: z.coerce.number().int().positive().optional(),
});

/**
 * Возвращает статистику online-app для текущего сайта.
 */
export default defineEventHandler(async (event): Promise<unknown> => {
  const query = onlineStatsQuerySchema.safeParse(getQuery(event));

  if (!query.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return await fetchOnlineService(`/api/v1/online/stats/${getOnlineSiteId()}`, {
    method: 'GET',
    query: query.data,
  });
});
