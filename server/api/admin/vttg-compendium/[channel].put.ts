import { StatusCodes } from 'http-status-codes';

import {
  fetchVttgCompendiumVersion,
  vttgCompendiumChannelParamsSchema,
  vttgCompendiumVersionBodySchema,
} from '#server/domain/vttg';

/**
 * Поднимает версию компендиума VTTG канала (dev или prod). Что версия выше
 * текущей, проверяет core-api канала (иначе 409 с причиной) — он же сразу
 * запускает пересборку выгрузки. Только для администратора.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = vttgCompendiumChannelParamsSchema.safeParse(
    getRouterParams(event),
  );

  const parsedBody = vttgCompendiumVersionBodySchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedParams.success || !parsedBody.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return fetchVttgCompendiumVersion(event, parsedParams.data.channel, {
    method: 'PUT',
    body: { version: parsedBody.data.version },
  });
});
