import {
  CATALOG_API_PREFIX,
  CATALOG_CACHE_RESET_PATH,
  CATALOG_CACHE_RESET_SECTIONS,
  CATALOG_CACHE_SECTIONS,
  CATALOG_EDITOR_FORM_SEGMENT,
  CATALOG_READ_METHOD,
  CATALOG_READ_ONLY_ACTION_SEGMENTS,
  CATALOG_SAFE_METHODS,
} from '../model/constants';

/** Адрес запроса, разобранный на части, важные для кэша. */
interface CatalogPath {
  /** Раздел core-api: первый кусок адреса после `/api/v2/`. */
  section: string;
  /** Последний кусок адреса. */
  lastSegment: string;
  /** Адрес без параметров. */
  pathname: string;
  /** Параметры запроса в постоянном порядке. */
  search: string;
}

/**
 * Разбирает адрес запроса. Параметры сортируются, чтобы один и тот же запрос
 * с разным порядком параметров попадал в одну запись кэша.
 *
 * @param path Адрес запроса вместе с параметрами.
 */
function parseCatalogPath(path: string): CatalogPath | undefined {
  const [pathname = '', query = ''] = path.split('?');

  if (!pathname.startsWith(CATALOG_API_PREFIX)) {
    return undefined;
  }

  const segments = pathname
    .slice(CATALOG_API_PREFIX.length)
    .split('/')
    .filter(Boolean);

  const section = segments.at(0);
  const lastSegment = segments.at(-1);

  if (!section || !lastSegment) {
    return undefined;
  }

  const searchParams = new URLSearchParams(query);

  searchParams.sort();

  return {
    section,
    lastSegment,
    pathname,
    search: searchParams.toString(),
  };
}

/**
 * Ключ записи кэша для запроса или `undefined`, если такой запрос не
 * кэшируется. В кэш идёт только чтение разделов каталога; форма редактора
 * (`/raw`) всегда запрашивается заново.
 *
 * Ключ закодирован целиком (`encodeURIComponent`): хранилище Nitro (unstorage)
 * нормализует ключ, отрезая всё после `?` и заменяя `/` на `:`. Без кодирования
 * все запросы к одному адресу с разными параметрами (страница, поиск,
 * фильтры) попадали бы в одну запись, и гость получал ответ на чужой запрос.
 *
 * @param method Метод запроса.
 * @param path Адрес запроса вместе с параметрами.
 */
export function getCatalogCacheKey(
  method: string,
  path: string,
): string | undefined {
  if (method !== CATALOG_READ_METHOD) {
    return undefined;
  }

  const catalogPath = parseCatalogPath(path);

  if (!catalogPath || !CATALOG_CACHE_SECTIONS.includes(catalogPath.section)) {
    return undefined;
  }

  if (catalogPath.lastSegment === CATALOG_EDITOR_FORM_SEGMENT) {
    return undefined;
  }

  const requestPath = catalogPath.search
    ? `${catalogPath.pathname}?${catalogPath.search}`
    : catalogPath.pathname;

  return encodeURIComponent(requestPath);
}

/**
 * Меняет ли запрос каталог, то есть нужно ли после него сбросить кэш. Это
 * любая запись в раздел каталога (создание, правка, удаление), откат записи к
 * прежней версии и ручной сброс кэша core-api администратором.
 *
 * @param method Метод запроса.
 * @param path Адрес запроса вместе с параметрами.
 */
export function isCatalogCacheReset(method: string, path: string): boolean {
  const catalogPath = parseCatalogPath(path);

  if (!catalogPath) {
    return false;
  }

  if (catalogPath.pathname === CATALOG_CACHE_RESET_PATH) {
    return true;
  }

  if (CATALOG_SAFE_METHODS.includes(method)) {
    return false;
  }

  if (CATALOG_READ_ONLY_ACTION_SEGMENTS.includes(catalogPath.lastSegment)) {
    return false;
  }

  return (
    CATALOG_CACHE_SECTIONS.includes(catalogPath.section)
    || CATALOG_CACHE_RESET_SECTIONS.includes(catalogPath.section)
  );
}
