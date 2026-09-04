import type { H3Event } from 'h3';

/**
 * Проксирует запрос в core-api как есть.
 * @param event Событие H3.
 */
export function proxy(event: H3Event) {
  return proxyRequest(event, getProxyPath(event));
}
