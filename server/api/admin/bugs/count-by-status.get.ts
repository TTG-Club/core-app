import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { assertAdminAccess } from '#server/utils/getUser';
import { BUG_REPORT_STATUSES, SOURCE_PLATFORMS } from '#shared/consts';

/**
 * Размер страницы для подсчёта: сами баг-репорты не нужны, интересует только
 * `totalElements`, но нулевой размер страницы Spring не принимает.
 */
const COUNT_PAGE_SIZE = 1;

const countQuerySchema = z.object({
  sourcePlatform: z.enum(SOURCE_PLATFORMS).optional(),
  userLogin: z.string().optional(),
  statusUpdatedBy: z.string().optional(),
});

const countPageSchema = z.object({
  totalElements: z.number(),
});

/**
 * Обработчик сводки «сколько баг-репортов в каждом статусе» (админская панель).
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR) и параллельно
 * спрашивает у микросервиса количество багов по каждому статусу: отдельной ручки
 * со сводкой по всем пользователям он не отдаёт, поэтому считаем по
 * `totalElements` отфильтрованного списка. Необязательные `sourcePlatform`,
 * `userLogin` и `statusUpdatedBy` сужают сводку так же, как список, — чтобы
 * цифры совпадали с ним под теми же фильтрами.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  assertAdminAccess(user);

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
    return await Promise.all(
      BUG_REPORT_STATUSES.map(async (status) => {
        const page = countPageSchema.parse(
          await $fetch(BUG_REPORT_EXTERNAL_API_BASE_URL, {
            method: 'GET',
            query: {
              status,
              sourcePlatform: parsedQuery.data.sourcePlatform,
              userLogin: parsedQuery.data.userLogin,
              statusUpdatedBy: parsedQuery.data.statusUpdatedBy,
              page: 0,
              size: COUNT_PAGE_SIZE,
            },
            headers,
          }),
        );

        return {
          status,
          count: page.totalElements,
        };
      }),
    );
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report-admin]',
      'Ошибка получения количества багов по статусам',
      error,
    );
  }
});
