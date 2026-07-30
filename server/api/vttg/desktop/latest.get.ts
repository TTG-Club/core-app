import type { VttgDesktopRelease } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import { getVttgDesktopRelease } from '#server/domain/vttg';

/**
 * Последняя сборка десктопного VTTG: версия, вес и прямая ссылка на установщик.
 * Данные публичные (тот же манифест читает само приложение), поэтому роут
 * открыт — доступ к раннему доступу решает не он, а выдача перка в кабинете.
 */
export default defineEventHandler(async (): Promise<VttgDesktopRelease> => {
  try {
    return await getVttgDesktopRelease();
  } catch (error) {
    consola.error('[VTTG Release Error]:', error);

    throw createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
  }
});
