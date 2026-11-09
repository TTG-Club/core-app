import type { MaintenanceGate } from '#shared/types';

import {
  getMaintenanceSiteSettings,
  MAINTENANCE_CACHE_CONTROL,
  resolveMaintenanceGate,
} from '#server/domain/maintenance';
import { CACHE_CONTROL_HEADER } from '#server/domain/page-cache';

/**
 * Показывать ли заглушку режима обновления текущему посетителю. Роут
 * публичный: его спрашивает сайт при переходах между страницами без
 * перезагрузки. Ответ зависит от посетителя, поэтому не кешируется.
 */
export default defineEventHandler(async (event): Promise<MaintenanceGate> => {
  setResponseHeader(event, CACHE_CONTROL_HEADER, MAINTENANCE_CACHE_CONTROL);

  return resolveMaintenanceGate(event, await getMaintenanceSiteSettings());
});
