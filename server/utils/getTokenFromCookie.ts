import type { H3Event } from 'h3';
import { USER_TOKEN_COOKIE } from '#shared/utils/const';
import { StatusCodes } from 'http-status-codes';

export const getTokenFromCookie = (event: H3Event) => {
  const token = getCookie(event, USER_TOKEN_COOKIE);

  if (!token) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  return token;
};
