import type { H3Event } from 'h3';
import { StatusCodes } from 'http-status-codes';
import { getErrorResponse } from '~~/shared/utils';
import { USER_TOKEN_COOKIE } from '~~/shared/consts';

export const getTokenFromCookie = (event: H3Event) => {
  const token = getCookie(event, USER_TOKEN_COOKIE);

  if (!token) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  return token;
};
