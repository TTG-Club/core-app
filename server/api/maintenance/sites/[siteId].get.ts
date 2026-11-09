import type { MaintenancePublicSiteSettings } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import {
  getMaintenanceSiteSettings,
  MAINTENANCE_CACHE_CONTROL,
} from '#server/domain/maintenance';
import { CACHE_CONTROL_HEADER } from '#server/domain/page-cache';
import { maintenanceSiteParamsSchema } from '#shared/utils';

/**
 * Настройка режима «сайт закрыт на обновление» сайта для его сервера: так
 * сайт D&D 2014 узнаёт, закрыт ли он (`/api/maintenance/sites/5e14`). Роут
 * публичный, без того, кто и когда сохранил настройку. Логика та же, что у
 * этого сайта: настройка из хранилища с кешем, а без неё или при сбое
 * хранилища сайт считается закрытым.
 *
 * Свой кеш держит сервер сайта, поэтому промежуточные кеши ответ не хранят:
 * выключение режима должно доходить быстро.
 */
export default defineEventHandler(
  async (event): Promise<MaintenancePublicSiteSettings> => {
    const parsedParams = maintenanceSiteParamsSchema.safeParse(
      getRouterParams(event),
    );

    if (!parsedParams.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    setResponseHeader(event, CACHE_CONTROL_HEADER, MAINTENANCE_CACHE_CONTROL);

    const { enabled, title, message } = await getMaintenanceSiteSettings(
      parsedParams.data.siteId,
    );

    return { enabled, title, message };
  },
);
