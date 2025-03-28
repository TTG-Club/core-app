import type { H3Event } from 'h3';
import { StatusCodes } from 'http-status-codes';

export const getUser = (event: H3Event) => {
  const user = getUserFromToken(event);

  if (!user) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  return user;
};
