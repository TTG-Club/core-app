import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { assertAdminAccess } from '#server/utils/getUser';

const filterOptionsSchema = z.object({
  userLogins: z.array(z.string()),
  statusUpdatedByLogins: z.array(z.string()),
});

/**
 * Обработчик значений для фильтров списка баг-репортов (админская панель):
 * логины авторов и логины пользователей, менявших статус.
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR)
 * и пересылает запрос на внешний микросервис.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return filterOptionsSchema.parse(
      await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/filter-options`, {
        method: 'GET',
        headers,
      }),
    );
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report-admin]',
      'Ошибка получения значений для фильтров баг-репортов',
      error,
    );
  }
});
