import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { BUG_REPORT_TYPES } from '#shared/consts';

const countQuerySchema = z.object({
  type: z.enum(BUG_REPORT_TYPES).optional(),
});

/**
 * Обработчик для получения количества баг-репортов текущего пользователя по статусам.
 *
 * Проверяет авторизацию пользователя, получает JWT-токен из заголовка/кук,
 * и делает GET-запрос к внешнему микросервису баг-репортов. Необязательный
 * `type` ограничивает сводку багами или пожеланиями; без него — все записи.
 */
export default defineEventHandler(async (event) => {
  await getUserFromToken(event);

  const parsedQuery = countQuerySchema.safeParse(getQuery(event));

  if (!parsedQuery.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const authHeader = getHeader(event, 'authorization');
  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return await $fetch(
      `${BUG_REPORT_EXTERNAL_API_BASE_URL}/my/count-by-status`,
      {
        method: 'GET',
        query: parsedQuery.data,
        headers,
      },
    );
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report]',
      'Ошибка получения количества багов по статусам',
      error,
    );
  }
});
