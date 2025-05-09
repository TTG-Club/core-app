import type { H3Event } from 'h3';

export function getProxyPath(event: H3Event) {
  const { url } = getApiSecrets();

  return url + event.path;
}
