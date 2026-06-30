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
 * Проверяет, что путь запроса относится к subscriber-service.
 * Совпадение строгое по сегменту: `/api/subscriptions` и `/api/subscriptions/...`,
 * но не `/api/subscriptions-foo`. Query-строка отбрасывается перед сравнением.
 */
function isSubscriberPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path;

  return SUBSCRIBER_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Возвращает полный URL для проксирования запроса.
 * Подписки/коды/награды уходят в subscriber-service, остальное — в core-api.
 */
export function getProxyPath(event: H3Event) {
  const { url } = isSubscriberPath(event.path)
    ? getSubscriberSecrets()
    : getApiSecrets();

  return url + event.path;
}
