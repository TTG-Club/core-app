import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

const ONLINE_SERVICE_TOKEN_HEADER = 'X-Online-Token';
const ONLINE_SITE_ID = '5e24';

const onlineSiteIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]*$/);

interface OnlineSecrets {
  token: string;
  url: string;
}

interface OnlineServiceHttpError extends Error {
  data?: unknown;
  response?: {
    status?: number;
    statusText?: string;
    _data?: unknown;
  };
  status?: number;
  statusCode?: number;
}

/**
 * Проверяет, что ошибка пришла от HTTP-клиента online-app.
 */
function isOnlineServiceHttpError(
  error: unknown,
): error is OnlineServiceHttpError {
  return (
    error instanceof Error
    && ('response' in error || 'status' in error || 'statusCode' in error)
  );
}

/**
 * Возвращает безопасный HTTP-статус для ответа приложения.
 */
function getOnlineServiceErrorStatus(
  error: OnlineServiceHttpError,
): StatusCodes {
  const status = error.response?.status ?? error.statusCode ?? error.status;

  switch (status) {
    case StatusCodes.BAD_REQUEST:
    case StatusCodes.UNAUTHORIZED:
    case StatusCodes.FORBIDDEN:
    case StatusCodes.NOT_FOUND:
    case StatusCodes.TOO_MANY_REQUESTS:
      return status;
    default:
      return StatusCodes.BAD_GATEWAY;
  }
}

/**
 * Создает нормализованную ошибку для ответа online-app.
 */
function createOnlineServiceError(
  error: unknown,
): ReturnType<typeof createError> {
  if (!isOnlineServiceHttpError(error)) {
    return createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
  }

  return createError(getErrorResponse(getOnlineServiceErrorStatus(error)));
}

/**
 * Возвращает настройки внешнего сервиса online-app.
 */
export function getOnlineSecrets(): OnlineSecrets {
  const { NITRO_ONLINE_API_TOKEN: token = '', NITRO_ONLINE_API_URL: url = '' } =
    process.env;

  if (!url || !token) {
    throw new Error('[ONLINE] Variables are not set');
  }

  return {
    token,
    url,
  };
}

/**
 * Возвращает идентификатор текущего сайта для online-app.
 */
export function getOnlineSiteId(): string {
  return onlineSiteIdSchema.parse(ONLINE_SITE_ID);
}

/**
 * Возвращает полный URL для запроса к online-app.
 */
function getOnlineServicePath(path: string): string {
  const { url } = getOnlineSecrets();

  return `${url}${path}`;
}

/**
 * Выполняет запрос к online-app с межсервисным токеном.
 */
export async function fetchOnlineService<Payload>(
  path: string,
  options: Parameters<typeof $fetch<Payload>>[1] = {},
): Promise<Payload> {
  const { token } = getOnlineSecrets();

  try {
    return await $fetch<Payload>(getOnlineServicePath(path), {
      ...options,
      headers: {
        ...options.headers,
        [ONLINE_SERVICE_TOKEN_HEADER]: token,
      },
    });
  } catch (error) {
    throw createOnlineServiceError(error);
  }
}
