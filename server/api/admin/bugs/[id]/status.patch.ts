import { isNitroError } from '#server/utils/nitroError';
import { Role } from '~/shared/types';

/**
 * Обработчик для обновления статуса баг-репорта (админская панель).
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR),
 * получает ID бага из параметров пути, считывает новый статус из тела запроса
 * и отправляет PATCH-запрос на внешний микросервис.
 */
export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event);

  if (
    !user.roles.includes(Role.ADMIN)
    && !user.roles.includes(Role.MODERATOR)
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ запрещен',
    });
  }

  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    const response = await $fetch(
      `https://bug-report.api.ttg.club/api/v1/bugs/${id}/status`,
      {
        method: 'PATCH',
        body,
        headers,
      },
    );

    return response;
  } catch (error: unknown) {
    consola.error(
      `[bug-report-admin] Ошибка обновления статуса бага ${id}:`,
      error,
    );

    let statusCode = 500;
    let statusMessage = 'Внутренняя ошибка сервера';
    let errorData: unknown;

    if (isNitroError(error)) {
      if (typeof error.statusCode === 'number') {
        statusCode = error.statusCode;
      }

      if (typeof error.statusMessage === 'string') {
        statusMessage = error.statusMessage;
      }

      if (error.data !== undefined) {
        errorData = error.data;
      }
    }

    throw createError({
      statusCode,
      statusMessage,
      data: errorData,
    });
  }
});
