import { StatusCodes } from 'http-status-codes';

import {
  fetchVttgCompendiumVersion,
  vttgCompendiumChannelParamsSchema,
} from '#server/domain/vttg';

/**
 * Текущая версия компендиума VTTG канала (dev или prod) и состояние
 * пересборки — из core-api этого канала. Только для администратора.
 */
export default defineEventHandler((event) => {
  const parsedParams = vttgCompendiumChannelParamsSchema.safeParse(
    getRouterParams(event),
  );

  if (!parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return fetchVttgCompendiumVersion(event, parsedParams.data.channel, {
    method: 'GET',
  });
});
