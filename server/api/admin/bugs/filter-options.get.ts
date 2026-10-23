import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { assertAdminAccess } from '#server/utils/getUser';
import { BUG_REPORT_TYPES } from '#shared/consts';

const filterOptionsQuerySchema = z.object({
  type: z.enum(BUG_REPORT_TYPES).optional(),
});

const filterOptionsSchema = z.object({
  userLogins: z.array(z.string()),
  statusUpdatedByLogins: z.array(z.string()),
});

/**
 * Обработчик значений для фильтров списка баг-репортов (админская панель):
 * логины авторов и логины пользователей, менявших статус.
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR)
 * и пересылает запрос на внешний микросервис. Необязательный `type` сужает
 * логины до записей одного типа: багов или пожеланий.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

  const parsedQuery = filterOptionsQuerySchema.safeParse(getQuery(event));

  if (!parsedQuery.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return filterOptionsSchema.parse(
      await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/filter-options`, {
        method: 'GET',
        query: parsedQuery.data,
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
