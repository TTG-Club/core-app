/**
 * Все запросы раздела поиска игр. Общий `/api/**` уводит незнакомые пути в
 * core-api, поэтому у find-game-api свой префикс и свой обработчик.
 */
export default defineEventHandler(proxyFindGame);
