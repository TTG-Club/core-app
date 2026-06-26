import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

const INTERNAL_SERVER_ERROR_MESSAGE = 'Внутренняя ошибка сервера';
const EXTERNAL_SERVICE_ERROR_MESSAGE = 'Ошибка внешнего сервиса';

/**
 * Проверяет, что значение является объектом с доступными полями.
 *
 * @param value Проверяемое значение.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Возвращает код ошибки из причины сетевого сбоя.
 *
 * @param error Перехваченная ошибка.
 */
function getCauseCode(error: unknown): string | undefined {
  const directCode = isRecord(error) ? error.code : undefined;

  if (typeof directCode === 'string') {
    return directCode;
  }

  const cause = error instanceof Error ? error.cause : undefined;
  const causeCode = isRecord(cause) ? cause.code : undefined;

  if (typeof causeCode === 'string') {
    return causeCode;
  }

  return undefined;
}

/**
 * Формирует короткое сообщение для лога без полного стека сетевой ошибки.
 *
 * @param error Перехваченная ошибка.
 */
function getFetchErrorLogMessage(error: unknown): string {
  const causeCode = getCauseCode(error);
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (causeCode) {
    return `${errorMessage} (${causeCode})`;
  }

  return errorMessage;
}

/**
 * Возвращает HTTP-статус для ошибки внешнего запроса.
 *
 * @param error Ошибка внешнего запроса.
 */
function getFetchErrorStatus(error: FetchError): number {
  return error.statusCode || StatusCodes.BAD_GATEWAY;
}

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
  consola.error(`${context} ${message}: ${getFetchErrorLogMessage(error)}`);

  if (error instanceof FetchError) {
    const status = getFetchErrorStatus(error);

    const errorMessage =
      error.statusMessage || error.message || EXTERNAL_SERVICE_ERROR_MESSAGE;

    throw createError({
      status,
      statusText: getReasonPhrase(status),
      message: errorMessage,
      data: error.data,
    });
  }

  throw createError({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    statusText: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    message: INTERNAL_SERVER_ERROR_MESSAGE,
  });
}
