import type { VttgBuild } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import { getVttgBuilds } from '#server/domain/vttg';

/**
 * Сборки VTTG: версия, вес и прямые ссылки на файлы каждой платформы. Данные
 * публичные (те же манифесты читает само приложение), поэтому роут открыт —
 * доступ к раннему доступу решает не он, а выдача перка в кабинете.
 */
export default defineEventHandler(async (): Promise<VttgBuild[]> => {
  try {
    return await getVttgBuilds();
  } catch (error) {
    consola.error('[VTTG Builds Error]:', error);

    throw createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
  }
});
