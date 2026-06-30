/**
 * Обработчик для проксирования запросов создания баг-репортов.
 *
 * Пересылает сырое тело multipart-запроса на внешний микросервис
 * без парсинга и пересборки, используя нативный fetch.
 * Сохраняет оригинальный Content-Type (включая boundary) и Authorization.
 */
import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event, false);

  if (!body) {
    throw createError({
      status: 400,
      statusText: 'Bad Request',
      message: 'Пустое тело запроса',
    });
  }

  const contentType = getHeader(event, 'content-type');
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {};

  if (contentType) {
    headers['content-type'] = contentType;
  }

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    const response = await fetch(BUG_REPORT_EXTERNAL_API_BASE_URL, {
      method: 'POST',
      body: new Uint8Array(body),
      headers,
    });

    const responseBody = await response.text();

    if (!response.ok) {
      consola.error(
        '[bug-report] Ошибка от бэкенда:',
        response.status,
        responseBody,
      );

      throw createError({
        status: response.status,
        statusText: response.statusText,
        message: responseBody || response.statusText,
        data: responseBody,
      });
    }

    return JSON.parse(responseBody);
  } catch (error: unknown) {
    if (isError(error)) {
      throw error;
    }

    consola.error('[bug-report] Ошибка сети:', error);

    throw createError({
      status: 502,
      statusText: 'Bad Gateway',
      message: 'Ошибка внешнего сервиса',
    });
  }
});
