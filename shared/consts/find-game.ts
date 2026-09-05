/**
 * Префикс same-origin маршрута сайта к find-game-api. Nitro снимает его и
 * подставляет `FIND_GAME_UPSTREAM_PREFIX`, поэтому фронт нигде не знает
 * реального адреса сервиса и ходит только по своему домену: cookie с сессией
 * уезжает автоматически, а SSE работает без заголовков в EventSource.
 */
export const FIND_GAME_API_PREFIX = '/api/find-game';

/** Префикс версии API самого find-game-api, куда переписывается запрос. */
export const FIND_GAME_UPSTREAM_PREFIX = '/api/v1';
