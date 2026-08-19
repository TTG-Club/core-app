import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { BUG_REPORT_STATUSES, SOURCE_PLATFORMS } from '#shared/consts';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  size: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  status: z.enum(BUG_REPORT_STATUSES).optional(),
});

/**
 * Белый список полей баг-репорта, который разрешено показывать его автору.
 *
 * Zod по умолчанию срезает незадекларированные ключи, поэтому `statusUpdatedBy`,
 * `userLogin` и `sessionId` не уйдут в браузер, даже если микросервис ответит
 * старым DTO (например, пока не задеплоена свежая сборка bug-report-service).
 * Это второй рубеж: сам микросервис их тоже не отдаёт.
 */
const myBugReportSchema = z.object({
  id: z.string(),
  description: z.string(),
  url: z.string().nullish(),
  status: z.enum(BUG_REPORT_STATUSES),
  sourcePlatform: z.enum(SOURCE_PLATFORMS),
  screenshotUrl: z.string().nullish(),
  createdAt: z.string(),
  statusUpdatedAt: z.string().nullish(),
  statusComment: z.string().nullish(),
  selectedText: z.string().nullish(),
});

const myBugsPageSchema = z.object({
  content: z.array(myBugReportSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  number: z.number(),
});

/**
 * Обработчик списка баг-репортов текущего пользователя.
 *
 * Проверяет авторизацию, пробрасывает пагинацию и фильтр по статусу на внешний
 * микросервис и возвращает ответ, очищенный от полей, по которым автор мог бы
 * узнать, кто менял статус его репорта.
 */
export default defineEventHandler(async (event) => {
  await getUserFromToken(event);

  const parsedQuery = listQuerySchema.safeParse(getQuery(event));

  if (!parsedQuery.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const authHeader = getHeader(event, 'authorization');
  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return myBugsPageSchema.parse(
      await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/my`, {
        method: 'GET',
        query: parsedQuery.data,
        headers,
      }),
    );
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report]',
      'Ошибка получения списка баг-репортов пользователя',
      error,
    );
  }
});
