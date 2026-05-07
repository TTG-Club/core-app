import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';

import { USER_TOKEN_COOKIE } from '#shared/consts';

/**
 * Возвращает access token из cookie запроса.
 */
function getTokenFromCookie(event: H3Event): string | undefined {
  return getCookie(event, USER_TOKEN_COOKIE);
}

/**
 * Возвращает access token из заголовка Authorization.
 */
function getTokenFromHeader(event: H3Event): string | undefined {
  const auth = getHeader(event, 'authorization');

  return auth?.replace(/^Bearer\s/, '');
}

/**
 * Возвращает актуальный access token из запроса.
 */
export function getTokenFromRequest(event: H3Event): string {
  const fromHeader = getTokenFromHeader(event);

  if (fromHeader) {
    return fromHeader;
  }

  const fromCookie = getTokenFromCookie(event);

  if (fromCookie) {
    return fromCookie;
  }

  throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
}
