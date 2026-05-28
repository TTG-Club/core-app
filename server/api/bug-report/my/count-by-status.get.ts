import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';

/**
 * Обработчик для получения количества баг-репортов текущего пользователя по статусам.
 *
 * Проверяет авторизацию пользователя, получает JWT-токен из заголовка/кук,
 * и делает GET-запрос к внешнему микросервису баг-репортов.
 */
export default defineEventHandler(async (event) => {
  await getUserFromToken(event);

  const authHeader = getHeader(event, 'authorization');
  const headers: Record<string, string> = {};

  if (authHeader) {
    headers.authorization = authHeader;
  }

  try {
    return await $fetch(
      `${BUG_REPORT_EXTERNAL_API_BASE_URL}/my/count-by-status`,
      {
        method: 'GET',
        headers,
      },
    );
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report]',
      'Ошибка получения количества багов по статусам',
      error,
    );
  }
});
