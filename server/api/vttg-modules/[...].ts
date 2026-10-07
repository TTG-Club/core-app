/**
 * Все запросы реестра модулей VTTG. Общий `/api/**` уводит незнакомые пути в
 * core-api, поэтому у реестра свой префикс и свой обработчик.
 */
export default defineEventHandler(proxyVttgModules);
