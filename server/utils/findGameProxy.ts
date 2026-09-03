import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';

import {
  FIND_GAME_API_PREFIX,
  FIND_GAME_UPSTREAM_PREFIX,
} from '#shared/consts';

/** Заголовки, при которых прокси и браузер не буферизуют SSE-поток. */
const SSE_RESPONSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  // no-transform запрещает промежуточным прокси сжимать и склеивать поток.
  'cache-control': 'no-cache, no-transform',
  'connection': 'keep-alive',
  // Нестандартный, но понятный nginx заголовок: без него он копит ответ в буфере
  // и события чата доезжают пачками по 4 КБ вместо реального времени.
  'x-accel-buffering': 'no',
} as const;

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

/**
 * Проксирует SSE-ленту чата.
 *
 * Отдельно от обычного прокси по двум причинам: ответ нельзя буферизовать
 * целиком (иначе события не появятся, пока сервис не закроет поток), и
 * upstream-соединение нужно рвать, как только ушёл клиент — иначе на сервисе
 * копятся живые `SseEmitter` после каждого закрытия вкладки.
 *
 * Ошибку доступа сервис отдаёт обычным `ProblemDetail` вместо потока, поэтому
 * неуспешный ответ пробрасывается как есть, а не превращается в пустую ленту.
 *
 * @param event Событие H3.
 */
export async function proxyFindGameStream(event: H3Event) {
  const controller = new AbortController();

  // Клиент ушёл (закрыл вкладку, размонтировал чат, потерял сеть) — рвём
  // upstream в ту же секунду.
  event.node.req.on('close', () => controller.abort());

  const upstream = await fetch(getFindGameProxyUrl(event), {
    headers: {
      accept: 'text/event-stream',
      ...getFindGameStreamHeaders(event),
    },
    signal: controller.signal,
  }).catch((error: unknown) => {
    // В лог уходит только код причины: сам URL содержит идентификаторы игры и
    // сессии, а заголовки — JWT.
    consola.error(
      '[find-game] SSE upstream недоступен:',
      getStreamErrorCode(error),
    );

    throw createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
  });

  if (!upstream.ok || !upstream.body) {
    setResponseStatus(event, upstream.status);

    const contentType = upstream.headers.get('content-type');

    if (contentType) {
      setResponseHeader(event, 'content-type', contentType);
    }

    return await upstream.text();
  }

  setResponseHeaders(event, SSE_RESPONSE_HEADERS);

  return sendStream(event, upstream.body);
}

/**
 * Заголовки, которые нужно донести до сервиса вместе с подпиской: сессия
 * пользователя и позиция, с которой браузер переподключается.
 * @param event Событие H3.
 */
function getFindGameStreamHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {};
  const authorization = getHeader(event, 'authorization');
  const lastEventId = getHeader(event, 'last-event-id');

  if (authorization) {
    headers.authorization = authorization;
  }

  if (lastEventId) {
    headers['last-event-id'] = lastEventId;
  }

  return headers;
}

/**
 * Короткий код сетевой ошибки для лога — без URL и заголовков запроса.
 * @param error Перехваченная ошибка.
 */
function getStreamErrorCode(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'AbortError';
  }

  const cause = error instanceof Error ? error.cause : undefined;

  if (cause && typeof cause === 'object' && 'code' in cause) {
    return String(cause.code);
  }

  return error instanceof Error ? error.name : 'UnknownError';
}
