import type { H3Event } from 'h3';

export const proxy = (event: H3Event) =>
  proxyRequest(event, getProxyPath(event));
