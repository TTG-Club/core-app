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
 * Чтение каталога (заклинания, бестиарий, предметы и так далее) гостям
 * отдаётся из кэша на сервере сайта. Вошедшим core-api отвечает с учётом их
 * сохранённых источников, поэтому их запросы идут мимо кэша. Любая запись в
 * каталог сбрасывает кэш, поэтому правка редактора видна сразу.
 */
export default defineEventHandler(async (event) => {
  const cacheKey = getCatalogCacheKey(event.method, event.path);

  if (cacheKey && !isCatalogCacheBypassed(event)) {
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
