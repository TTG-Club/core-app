import { Role } from '~/shared/types';

interface NitroError {
  statusCode?: number;
  statusMessage?: string;
  data?: unknown;
}

function isNitroError(err: unknown): err is NitroError {
  return typeof err === 'object' && err !== null;
}

/**
 * Обработчик для получения списка баг-репортов (админская панель).
 *
 * Проверяет права пользователя (требуется ADMIN или MODERATOR),
 * считывает входящие query-параметры (фильтры, пагинация)
 * и пересылает запрос на внешний микросервис.
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

  const query = getQuery(event);
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    const response = await $fetch(
      'https://bug-report.api.ttg.club/api/v1/bugs',
      {
        method: 'GET',
        query,
        headers,
      },
    );

    return response;
  } catch (error: unknown) {
    consola.error('[bug-report-admin] Ошибка получения списка багов:', error);

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
