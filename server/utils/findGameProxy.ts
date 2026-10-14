import type { H3Event } from 'h3';

import {
  FIND_GAME_API_PREFIX,
  FIND_GAME_UPSTREAM_PREFIX,
} from '#shared/consts';

import { getServiceUpstreamPath } from './serviceProxy';

/**
 * Переписывает same-origin путь сайта в путь find-game-api.
 * `/api/find-game/games?inviteCode=...` превращается в
 * `/api/v1/games?inviteCode=...` — query сохраняется целиком, включая
 * `inviteCode`, без которого приватная игра не откроется.
 *
 * Чужие пути отбрасываются с 404: обработчик обязан быть строго ограничен
 * своим префиксом, иначе он превратился бы в открытый прокси.
 *
 * @param path Путь запроса к сайту вместе с query-строкой.
 */
export function getFindGameUpstreamPath(path: string): string {
  return getServiceUpstreamPath(
    path,
    FIND_GAME_API_PREFIX,
    FIND_GAME_UPSTREAM_PREFIX,
  );
}

/**
 * Полный upstream-URL запроса к find-game-api.
 * @param event Событие H3.
 */
export function getFindGameProxyUrl(event: H3Event): string {
  return getFindGameSecrets().url + getFindGameUpstreamPath(event.path);
}

/**
 * Проксирует обычный (не потоковый) запрос в find-game-api.
 *
 * Тело ответа отдаётся как есть, поэтому `ProblemDetail` сервиса доезжает до
 * клиента вместе со статусом и `content-type: application/problem+json`.
 * `Authorization` подставляет общий middleware сайта из cookie сессии.
 *
 * @param event Событие H3.
 */
export function proxyFindGame(event: H3Event) {
  return proxyRequest(event, getFindGameProxyUrl(event));
}
