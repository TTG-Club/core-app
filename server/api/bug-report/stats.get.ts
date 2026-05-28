import { FetchError } from 'ofetch';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';

/**
 * Возвращает общую статистику по баг-репортам: количество всего,
 * количество решённых и топ-10 пользователей по решённым багам.
 *
 * Доступен без авторизации.
 */
export default defineEventHandler(async () => {
  try {
    return await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/stats`, {
      method: 'GET',
    });
  } catch (error: unknown) {
    consola.error(
      '[bug-report] Ошибка получения статистики баг-репортов:',
      error,
    );

    if (error instanceof FetchError) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || 'Внутренняя ошибка сервера',
        data: error.data,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера',
    });
  }
});
