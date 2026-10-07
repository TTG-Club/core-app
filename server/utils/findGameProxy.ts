import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';

import {
  FIND_GAME_API_PREFIX,
  FIND_GAME_UPSTREAM_PREFIX,
} from '#shared/consts';

/**
 * Делит путь запроса на часть до знака вопроса и строку параметров.
 * @param path Путь запроса вместе с query-строкой.
 */
function splitPath(path: string): { pathname: string; search: string } {
  const queryStart = path.indexOf('?');

  if (queryStart < 0) {
    return { pathname: path, search: '' };
  }

  return {
    pathname: path.slice(0, queryStart),
    search: path.slice(queryStart),
  };
}

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
  const { pathname, search } = splitPath(path);

  if (
    pathname !== FIND_GAME_API_PREFIX
    && !pathname.startsWith(`${FIND_GAME_API_PREFIX}/`)
  ) {
    throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
  }

  const rest = pathname.slice(FIND_GAME_API_PREFIX.length);

  // Путь до сервиса собирается только из сегментов запроса; `..` в нём мог бы
  // увести запрос за пределы `/api/v1`, поэтому такой путь не обслуживаем.
  if (rest.split('/').includes('..')) {
    throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
  }

  return `${FIND_GAME_UPSTREAM_PREFIX}${rest}${search}`;
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
