import { StatusCodes } from 'http-status-codes';

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
 * Переписывает same-origin путь сайта в путь отдельного сервиса:
 * путь с префиксом сайта превращается в тот же путь с префиксом сервиса,
 * query сохраняется целиком.
 *
 * Чужие пути отбрасываются с 404: обработчик обязан быть строго ограничен
 * своим префиксом, иначе он превратился бы в открытый прокси.
 *
 * @param path Путь запроса к сайту вместе с query-строкой.
 * @param sitePrefix Префикс маршрута на сайте, например `/api/find-game`.
 * @param upstreamPrefix Префикс API сервиса, например `/api/v1`.
 */
export function getServiceUpstreamPath(
  path: string,
  sitePrefix: string,
  upstreamPrefix: string,
): string {
  const { pathname, search } = splitPath(path);

  if (pathname !== sitePrefix && !pathname.startsWith(`${sitePrefix}/`)) {
    throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
  }

  const rest = pathname.slice(sitePrefix.length);

  // Путь до сервиса собирается только из сегментов запроса; `..` в нём мог бы
  // увести запрос за пределы версии API, поэтому такой путь не обслуживаем.
  if (rest.split('/').includes('..')) {
    throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
  }

  return `${upstreamPrefix}${rest}${search}`;
}
