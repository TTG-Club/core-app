/**
 * Интерфейс ошибки, возвращаемой Nitro при проксировании запросов к внешним API.
 */
export interface NitroError {
  statusCode?: number;
  statusMessage?: string;
  data?: unknown;
}

/**
 * Проверяет, является ли переданное значение объектом с опциональными полями NitroError.
 *
 * @param error Неизвестное значение для проверки.
 */
export function isNitroError(error: unknown): error is NitroError {
  return typeof error === 'object' && error !== null;
}
