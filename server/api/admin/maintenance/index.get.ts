import type { MaintenanceSiteSettings } from '#shared/types';

import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';

import {
  MAINTENANCE_ERROR_LOG,
  readMaintenanceSiteSettings,
} from '#server/domain/maintenance';
import { assertAdminRole } from '#server/utils/getUser';

/**
 * Настройка режима обновления для формы админки — прямо из хранилища, мимо
 * кеша. Недоступное хранилище — ошибка, а не умолчание: иначе форма показала
 * бы админу не то, что сохранено. Только для администратора.
 */
export default defineEventHandler(
  async (event): Promise<MaintenanceSiteSettings> => {
    await assertAdminRole(event);

    try {
      return await readMaintenanceSiteSettings();
    } catch (error) {
      consola.error(MAINTENANCE_ERROR_LOG, error);

      if (error instanceof H3Error) {
        throw error;
      }

      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  },
);
