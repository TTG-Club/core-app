/**
 * Префикс same-origin маршрута сайта к реестру модулей VTTG
 * (vttg-module-registry). Nitro снимает его и подставляет
 * `VTTG_MODULES_UPSTREAM_PREFIX`: фронт ходит только по своему домену, и
 * cookie с сессией уезжает автоматически.
 */
export const VTTG_MODULES_API_PREFIX = '/api/vttg-modules';

/** Префикс версии API самого реестра, куда переписывается запрос. */
export const VTTG_MODULES_UPSTREAM_PREFIX = '/api/v1';
