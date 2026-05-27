/**
 * Обработчик для проксирования запросов создания баг-репортов.
 *
 * Пересылает сырое тело multipart-запроса на внешний микросервис
 * без парсинга и пересборки, используя нативный fetch.
 * Сохраняет оригинальный Content-Type (включая boundary) и Authorization.
 */
export default defineEventHandler(async (event) => {
  const body = await readRawBody(event, false);

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Пустое тело запроса',
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
    const response = await fetch(
      'https://bug-report.api.ttg.club/api/v1/bugs',
      {
        method: 'POST',
        body: new Uint8Array(body),
        headers,
      },
    );

    const responseBody = await response.text();

    if (!response.ok) {
      consola.error(
        '[bug-report] Ошибка от бэкенда:',
        response.status,
        responseBody,
      );

      throw createError({
        statusCode: response.status,
        statusMessage: response.statusText,
        data: responseBody,
      });
    }

    return JSON.parse(responseBody);
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error;
    }

    consola.error('[bug-report] Ошибка сети:', error);

    throw createError({
      statusCode: 502,
      statusMessage: 'Ошибка внешнего сервиса',
    });
  }
});
