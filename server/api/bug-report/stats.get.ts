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
    return handleFetchError(
      '[bug-report]',
      'Ошибка получения статистики баг-репортов',
      error,
    );
  }
});
