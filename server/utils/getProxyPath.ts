import type { H3Event } from 'h3';

/**
 * Префиксы путей, которые обслуживает subscriber-service (подписки, коды, награды),
 * а не core-api. Эти запросы проксируются на NITRO_SUBSCRIBER_API_URL.
 */
const SUBSCRIBER_PATH_PREFIXES = [
  '/api/subscriptions',
  '/api/rewards',
] as const;

/**
 * Префиксы путей сервиса комментариев. Эти запросы проксируются
 * на NITRO_COMMENTS_API_URL.
 */
const COMMENTS_PATH_PREFIXES = ['/api/v1/comments'] as const;

/**
 * Проверяет, что путь запроса начинается с одного из префиксов.
 * Совпадение строгое по сегменту: `/api/foo` и `/api/foo/...`,
 * но не `/api/foo-bar`. Query-строка отбрасывается перед сравнением.
 */
function isPathWithPrefix(path: string, prefixes: readonly string[]): boolean {
  const pathname = path.split('?')[0] ?? path;

  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Возвращает базовый URL внешнего сервиса для пути запроса.
 * Подписки/коды/награды уходят в subscriber-service, комментарии —
 * в comments-service, остальное — в core-api.
 */
function getProxyBaseUrl(path: string): string {
  if (isPathWithPrefix(path, SUBSCRIBER_PATH_PREFIXES)) {
    return getSubscriberSecrets().url;
  }

  if (isPathWithPrefix(path, COMMENTS_PATH_PREFIXES)) {
    return getCommentsSecrets().url;
  }

  return getApiSecrets().url;
}

/**
 * Возвращает полный URL для проксирования запроса.
 */
export function getProxyPath(event: H3Event) {
  return getProxyBaseUrl(event.path) + event.path;
}
