import type { VttgDocsSettings } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import {
  readVttgDocsSettings,
  VTTG_DOCS_ERROR_LOG,
} from '#server/domain/vttg-docs';
import { assertAdminRole } from '#server/utils/getUser';

/**
 * Настройка раздела документации VTTG для формы админки — прямо из
 * хранилища, мимо кеша. Только для администратора.
 */
export default defineEventHandler(async (event): Promise<VttgDocsSettings> => {
  await assertAdminRole(event);

  try {
    return await readVttgDocsSettings();
  } catch (error) {
    consola.error(VTTG_DOCS_ERROR_LOG, error);

    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
