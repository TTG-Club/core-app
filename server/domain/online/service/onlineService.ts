import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

const ONLINE_SERVICE_TOKEN_HEADER = 'X-Online-Token';

interface OnlineSecrets {
  token: string;
  url: string;
}

/**
 * Возвращает безопасный HTTP-статус для ответа приложения.
 */
function getOnlineServiceErrorStatus(error: FetchError): StatusCodes {
  switch (error.statusCode) {
    case StatusCodes.BAD_REQUEST:
      return StatusCodes.BAD_REQUEST;
    case StatusCodes.UNAUTHORIZED:
      return StatusCodes.UNAUTHORIZED;
    case StatusCodes.FORBIDDEN:
      return StatusCodes.FORBIDDEN;
    case StatusCodes.NOT_FOUND:
      return StatusCodes.NOT_FOUND;
    case StatusCodes.TOO_MANY_REQUESTS:
      return StatusCodes.TOO_MANY_REQUESTS;
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
  if (error instanceof FetchError) {
    return createError(getErrorResponse(getOnlineServiceErrorStatus(error)));
  }

  return createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
}

/**
 * Возвращает настройки внешнего сервиса online-app.
 */
function getOnlineSecrets(): OnlineSecrets {
  const {
    online: { apiToken: token, apiUrl: url },
  } = useRuntimeConfig();

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
  const {
    online: { siteId },
  } = useRuntimeConfig();

  if (!siteId) {
    throw new Error('[ONLINE] Site ID is not set');
  }

  return siteId;
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
