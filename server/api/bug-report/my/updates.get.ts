import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';

const updatesQuerySchema = z.object({
  since: z.string().optional(),
});

const updatesSchema = z.object({
  count: z.number(),
  lastStatusUpdatedAt: z.string().nullish(),
});

/**
 * Обработчик сводки изменений по баг-репортам текущего пользователя.
 *
 * Возвращает, сколько репортов сменили статус позже отметки `since`, и самую
 * свежую дату изменения — по ним профиль рисует индикатор «есть новости».
 * Отметку клиент присылает ту же, что раньше получил от сервиса, поэтому даты
 * без часового пояса сравниваются согласованно.
 */
export default defineEventHandler(async (event) => {
  await getUserFromToken(event);

  const parsedQuery = updatesQuerySchema.safeParse(getQuery(event));

  if (!parsedQuery.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const authHeader = getHeader(event, 'authorization');
  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return updatesSchema.parse(
      await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/my/updates`, {
        method: 'GET',
        query: parsedQuery.data,
        headers,
      }),
    );
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report]',
      'Ошибка получения сводки изменений по баг-репортам',
      error,
    );
  }
});
