import type { H3Event } from 'h3';

import type { CatalogResponse, ResolvedCatalogResponse } from '../model';

import { Role } from '~/shared/types';

import {
  CATALOG_CACHE_STATE_HEADER,
  CATALOG_CACHE_STORAGE,
  CATALOG_CONTENT_TYPE_HEADER,
  CATALOG_DEFAULT_CONTENT_TYPE,
  CATALOG_FIRST_ERROR_STATUS,
  CATALOG_HOP_HEADERS,
  CATALOG_PERSONAL_HEADERS,
} from '../model';

/**
 * Запросы в core-api, которые уже идут: одновременные посетители одной
 * страницы ждут один общий запрос, а не шлют каждый свой.
 */
const pendingLoads = new Map<string, Promise<CatalogResponse>>();

/**
 * Номер «поколения» кэша, растёт при каждом сбросе. Ответ, запрошенный до
 * сброса и пришедший после него, в кэш не кладётся: иначе старые данные
 * пережили бы правку редактора.
 */
let cacheGeneration = 0;

/**
 * Заголовки запроса в core-api без личных данных посетителя: общий ответ
 * запрашивается так, как его запросил бы гость.
 *
 * @param event Событие H3.
 */
function getGuestRequestHeaders(event: H3Event): Headers {
  const guestHeaders = new Headers();

  for (const [name, value] of Object.entries(getRequestHeaders(event))) {
    const headerName = name.toLowerCase();

    if (
      value !== undefined
      && !CATALOG_PERSONAL_HEADERS.includes(headerName)
      && !CATALOG_HOP_HEADERS.includes(headerName)
    ) {
      guestHeaders.set(headerName, value);
    }
  }

  return guestHeaders;
}

/**
 * Запрашивает ответ в core-api и при успехе кладёт его в кэш.
 *
 * @param event Событие H3.
 * @param cacheKey Ключ записи кэша.
 */
async function loadCatalogResponse(
  event: H3Event,
  cacheKey: string,
): Promise<CatalogResponse> {
  const generation = cacheGeneration;

  const apiResponse = await fetch(getProxyPath(event), {
    headers: getGuestRequestHeaders(event),
  });

  const catalogResponse: CatalogResponse = {
    status: apiResponse.status,
    body: await apiResponse.text(),
    contentType:
      apiResponse.headers.get(CATALOG_CONTENT_TYPE_HEADER)
      ?? CATALOG_DEFAULT_CONTENT_TYPE,
  };

  if (apiResponse.ok && generation === cacheGeneration) {
    await useStorage(CATALOG_CACHE_STORAGE).setItemRaw<CatalogResponse>(
      cacheKey,
      catalogResponse,
    );
  }

  return catalogResponse;
}

/**
 * Возвращает ответ из кэша, а если его там нет — запрашивает в core-api.
 *
 * @param event Событие H3.
 * @param cacheKey Ключ записи кэша.
 */
async function resolveCatalogResponse(
  event: H3Event,
  cacheKey: string,
): Promise<ResolvedCatalogResponse> {
  const cachedResponse = await useStorage(
    CATALOG_CACHE_STORAGE,
  ).getItemRaw<CatalogResponse>(cacheKey);

  if (cachedResponse) {
    return { response: cachedResponse, state: 'hit' };
  }

  const pendingLoad = pendingLoads.get(cacheKey);

  if (pendingLoad) {
    return { response: await pendingLoad, state: 'miss' };
  }

  const load = loadCatalogResponse(event, cacheKey).finally(() => {
    pendingLoads.delete(cacheKey);
  });

  pendingLoads.set(cacheKey, load);

  return { response: await load, state: 'miss' };
}

/**
 * Отдаёт посетителю ответ каталога: из кэша или свежий из core-api. Ошибки
 * core-api (например, 404 несуществующей записи) передаются как есть и в кэш
 * не попадают.
 *
 * @param event Событие H3.
 * @param cacheKey Ключ записи кэша.
 */
export async function sendCatalogResponse(
  event: H3Event,
  cacheKey: string,
): Promise<string> {
  const { response, state } = await resolveCatalogResponse(event, cacheKey);

  setResponseStatus(event, response.status);

  setResponseHeaders(event, {
    [CATALOG_CONTENT_TYPE_HEADER]: response.contentType,
    [CATALOG_CACHE_STATE_HEADER]: state,
  });

  return response.body;
}

/**
 * Сбрасывает кэш каталога целиком. Целиком, а не по одной записи: правка
 * существа меняет и его страницу, и списки, и поиск, а смена акронима
 * источника — адреса всех его записей.
 */
export async function clearCatalogCache(): Promise<void> {
  cacheGeneration += 1;

  await useStorage(CATALOG_CACHE_STORAGE).clear();
}

/**
 * Идёт ли запрос мимо кэша. Редакторы каталога (администратор и модератор)
 * всегда получают свежие данные: они первыми смотрят на результат правок,
 * в том числе сделанных мимо сайта.
 *
 * @param event Событие H3.
 */
export async function isCatalogCacheBypassed(event: H3Event): Promise<boolean> {
  try {
    const { roles } = await verifyJwt(getTokenFromRequest(event));

    return roles.includes(Role.ADMIN) || roles.includes(Role.MODERATOR);
  } catch {
    // Гость или посетитель с негодным токеном — обычный читатель каталога.
    return false;
  }
}

/**
 * Принял ли core-api запрос: кэш сбрасывается только после удачной записи.
 *
 * @param event Событие H3 с уже отправленным ответом.
 */
export function isCatalogRequestAccepted(event: H3Event): boolean {
  return getResponseStatus(event) < CATALOG_FIRST_ERROR_STATUS;
}
