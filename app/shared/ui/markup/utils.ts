import { consola } from 'consola';

export function logError(
  context: string,
  message: string,
  data?: unknown,
): void {
  consola.error(`[Markup ${context}]`, message, data);
}
