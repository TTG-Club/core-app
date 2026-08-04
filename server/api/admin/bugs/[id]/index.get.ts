import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { assertAdminAccess } from '#server/utils/getUser';

/**
 * Обработчик для получения одного баг-репорта по ID (админская панель).
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR),
 * получает ID бага из параметров пути и пересылает запрос
 * на внешний микросервис.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

  const id = getRouterParam(event, 'id');
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/${id}`, {
      method: 'GET',
      headers,
    });
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report-admin]',
      `Ошибка получения баг-репорта ${id}`,
      error,
    );
  }
});
