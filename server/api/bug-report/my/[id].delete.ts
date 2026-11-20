import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';

/** Идентификатор репорта — UUID: иначе в адрес микросервиса ушла бы произвольная строка. */
const withdrawParamsSchema = z.object({
  id: z.uuid(),
});

/**
 * Обработчик отзыва своего баг-репорта автором.
 *
 * Проверяет авторизацию и формат идентификатора, затем шлёт DELETE на
 * `/my/{id}` микросервиса. Права проверяет сам микросервис: удалить можно только
 * свой репорт и только пока его не взяли в работу (статус `NEW`). Отказы
 * пробрасываются как есть — 404 (чужой или уже удалён), 409 (уже в работе);
 * пока ручка не задеплоена, сервис ответит 403/404/405, и страница покажет
 * общую ошибку.
 */
export default defineEventHandler(async (event) => {
  await getUserFromToken(event);

  const parsedParams = withdrawParamsSchema.safeParse(getRouterParams(event));

  if (!parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const { id } = parsedParams.data;
  const authHeader = getHeader(event, 'authorization');
  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/my/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report]',
      `Ошибка отзыва баг-репорта ${id}`,
      error,
    );
  }

  setResponseStatus(event, StatusCodes.NO_CONTENT);

  return null;
});
