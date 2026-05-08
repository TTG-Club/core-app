import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { fetchOnlineService, getOnlineSiteId } from '#server/domain/online';

const onlineHeartbeatBodySchema = z.object({
  key: z.string().min(1).max(128),
  previousGuestKey: z.string().min(1).max(128).optional(),
  type: z.enum(['GUEST', 'REGISTERED']),
});

/**
 * Принимает heartbeat от фронта и пересылает его в online-app от имени backend.
 */
export default defineEventHandler(async (event): Promise<unknown> => {
  const body = onlineHeartbeatBodySchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!body.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return await fetchOnlineService('/api/v2/online/heartbeat', {
    body: {
      ...body.data,
      siteId: getOnlineSiteId(),
    },
    method: 'POST',
  });
});
