import type { H3Event } from 'h3';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

export const getUserFromToken = async (event: H3Event) => {
  const cookie = getCookie(event, USER_TOKEN_COOKIE);

  if (!cookie) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  try {
    const payload = verifyAuthJwt(cookie);

    const user = await prisma.user.findUnique({
      where: { username: payload.username },
      select: {
        username: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return Promise.reject(
        createError(getErrorResponse(StatusCodes.NOT_FOUND)),
      );
    }

    return user;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
    }

    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }
};
