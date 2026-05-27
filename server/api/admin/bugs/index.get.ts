import { FetchError } from 'ofetch';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { assertAdminAccess } from '#server/utils/getUser';

/**
 * Обработчик для получения списка баг-репортов (админская панель).
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR),
 * считывает входящие query-параметры (фильтры, пагинация)
 * и пересылает запрос на внешний микросервис.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

  const query = getQuery(event);
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return await $fetch(BUG_REPORT_EXTERNAL_API_BASE_URL, {
      method: 'GET',
      query,
      headers,
    });
  } catch (error: unknown) {
    consola.error('[bug-report-admin] Ошибка получения списка багов:', error);

    if (error instanceof FetchError) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || 'Внутренняя ошибка сервера',
        data: error.data,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера',
    });
  }
});
