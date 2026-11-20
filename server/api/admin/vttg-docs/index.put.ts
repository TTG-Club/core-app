import type { VttgDocsSettings } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import {
  saveVttgDocsSettings,
  VTTG_DOCS_ERROR_LOG,
} from '#server/domain/vttg-docs';
import { assertAdminRole } from '#server/utils/getUser';
import { vttgDocsSettingsUpdateSchema } from '#shared/utils';

/**
 * Сохраняет, каким ролям виден dev-канал документации VTTG. Действует сразу:
 * кеш настройки сбрасывается. Только для администратора.
 */
export default defineEventHandler(async (event): Promise<VttgDocsSettings> => {
  await assertAdminRole(event);

  const parsedBody = vttgDocsSettingsUpdateSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const { username } = await getUserFromToken(event);

  try {
    return await saveVttgDocsSettings(parsedBody.data, username);
  } catch (error) {
    consola.error(VTTG_DOCS_ERROR_LOG, error);

    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
