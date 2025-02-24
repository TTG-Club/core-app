import type { H3Event } from 'h3';
import { StatusCodes } from 'http-status-codes';
import { getErrorResponse } from '~~/shared/utils';
import { USER_TOKEN_COOKIE } from '~~/shared/consts';

function getTokenFromCookie(event: H3Event) {
  return getCookie(event, USER_TOKEN_COOKIE);
}

function getTokenFromHeader(event: H3Event) {
  const auth = getHeader(event, 'authorization');

  return auth?.replace(/^Bearer\s/, '');
}

export function getTokenFromRequest(event: H3Event) {
  const fromCookie = getTokenFromCookie(event);

  if (fromCookie) {
    return fromCookie;
  }

  const fromHeader = getTokenFromHeader(event);

  if (fromHeader) {
    return fromHeader;
  }

  throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
}
