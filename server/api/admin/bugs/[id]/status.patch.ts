import { FetchError } from 'ofetch';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { assertAdminAccess } from '#server/utils/getUser';

/**
 * Обработчик для обновления статуса баг-репорта (админская панель).
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR),
 * получает ID бага из параметров пути, считывает новый статус из тела запроса
 * и отправляет PATCH-запрос на внешний микросервис.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body,
      headers,
    });
  } catch (error: unknown) {
    consola.error(
      `[bug-report-admin] Ошибка обновления статуса бага ${id}:`,
      error,
    );

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
