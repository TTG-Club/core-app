import type { H3Event } from 'h3';
import { getProxyPath } from '~~/server/utils/getProxyPath';

export const proxy = (event: H3Event) =>
  proxyRequest(event, getProxyPath(event));
