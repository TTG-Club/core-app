import {
  clearCatalogCache,
  getCatalogCacheKey,
  isCatalogCacheBypassed,
  isCatalogCacheReset,
  isCatalogRequestAccepted,
  sendCatalogResponse,
} from '#server/domain/catalog-cache';

/**
 * Все запросы к API без собственного обработчика уходят в core-api.
 *
 * Чтение каталога (заклинания, бестиарий, предметы и так далее) отдаётся из
 * кэша на сервере сайта: эти ответы одинаковы для всех посетителей. Любая
 * запись в каталог сбрасывает кэш, поэтому правка редактора видна сразу.
 */
export default defineEventHandler(async (event) => {
  const cacheKey = getCatalogCacheKey(event.method, event.path);

  if (cacheKey && !(await isCatalogCacheBypassed(event))) {
    return sendCatalogResponse(event, cacheKey);
  }

  const proxyResponse = await proxy(event);

  if (
    isCatalogCacheReset(event.method, event.path)
    && isCatalogRequestAccepted(event)
  ) {
    await clearCatalogCache();
  }

  return proxyResponse;
});
