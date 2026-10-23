import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { assertAdminAccess } from '#server/utils/getUser';
import { BUG_REPORT_TYPES } from '#shared/consts';

const typeBodySchema = z.object({
  type: z.enum(BUG_REPORT_TYPES),
});

/**
 * Обработчик смены типа записи: баг ↔ пожелание (админская панель).
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR), получает ID
 * записи из параметров пути, проверяет новый тип из тела запроса и отправляет
 * PATCH-запрос на внешний микросервис. Статус записи при этом не меняется.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

  const id = getRouterParam(event, 'id');
  const parsedBody = typeBodySchema.safeParse(await readBody(event));

  if (!parsedBody.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/${id}/type`, {
      method: 'PATCH',
      body: parsedBody.data,
      headers,
    });
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report-admin]',
      `Ошибка смены типа бага ${id}`,
      error,
    );
  }
});
