import type { H3Event } from 'h3';

import {
  VTTG_MODULES_API_PREFIX,
  VTTG_MODULES_UPSTREAM_PREFIX,
} from '#shared/consts';

import { getServiceUpstreamPath } from './serviceProxy';

/**
 * Переписывает same-origin путь сайта в путь реестра модулей VTTG:
 * `/api/vttg-modules/submissions/my` → `/api/v1/submissions/my`.
 * @param path Путь запроса к сайту вместе с query-строкой.
 */
export function getVttgModulesUpstreamPath(path: string): string {
  return getServiceUpstreamPath(
    path,
    VTTG_MODULES_API_PREFIX,
    VTTG_MODULES_UPSTREAM_PREFIX,
  );
}

/**
 * Проксирует запрос в реестр модулей VTTG. `ProblemDetail` сервиса доезжает
 * до клиента как есть, `Authorization` подставляет общий middleware сайта.
 * @param event Событие H3.
 */
export function proxyVttgModules(event: H3Event) {
  return proxyRequest(
    event,
    getVttgModulesSecrets().url + getVttgModulesUpstreamPath(event.path),
  );
}
