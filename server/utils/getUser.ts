import type { H3Event } from 'h3';
import { StatusCodes } from 'http-status-codes';

export const getUser = (event: H3Event) => {
  const cookie = getCookie(event, USER_TOKEN_COOKIE);

  if (!cookie) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  const user = getUserFromToken(cookie);

  if (!user) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  return user;
};
