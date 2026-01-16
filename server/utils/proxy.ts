import type { H3Event } from 'h3';

export function proxy(event: H3Event) {
  return proxyRequest(event, getProxyPath(event));
}
