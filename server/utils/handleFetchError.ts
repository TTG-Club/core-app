import { FetchError } from 'ofetch';

/**
 * Обрабатывает ошибку от внешнего API-запроса и выбрасывает H3-ошибку.
 *
 * Если ошибка является FetchError — пробрасывает статус-код и сообщение.
 * Иначе — возвращает 500.
 *
 * @param context Контекст для логирования (например, '[bug-report]').
 * @param message Описание операции для лога.
 * @param error Перехваченная ошибка.
 */
export function handleFetchError(
  context: string,
  message: string,
  error: unknown,
): never {
  consola.error(`${context} ${message}:`, error);

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
