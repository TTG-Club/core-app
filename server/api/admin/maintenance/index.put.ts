import type { MaintenanceSiteSettings } from '#shared/types';

import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';

import {
  MAINTENANCE_ERROR_LOG,
  saveMaintenanceSiteSettings,
} from '#server/domain/maintenance';
import { assertAdminRole } from '#server/utils/getUser';
import { maintenanceSettingsUpdateSchema } from '#shared/utils';

/**
 * Включает или выключает режим «сайт закрыт на обновление» и меняет текст
 * заглушки. Действует сразу: кеш настройки сбрасывается. Только для
 * администратора.
 */
export default defineEventHandler(
  async (event): Promise<MaintenanceSiteSettings> => {
    await assertAdminRole(event);

    const parsedBody = maintenanceSettingsUpdateSchema.safeParse(
      await readBody<unknown>(event),
    );

    if (!parsedBody.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    const { username } = await getUserFromToken(event);

    try {
      return await saveMaintenanceSiteSettings(parsedBody.data, username);
    } catch (error) {
      consola.error(MAINTENANCE_ERROR_LOG, error);

      if (error instanceof H3Error) {
        throw error;
      }

      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  },
);
