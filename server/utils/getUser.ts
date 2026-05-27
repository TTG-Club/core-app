import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';
import { errors } from 'jose';

import { Role } from '~/shared/types';

export function getUserFromToken(event: H3Event) {
  const token = getTokenFromRequest(event);

  try {
    return verifyJwt(token);
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
    }

    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }
}

export async function isUserHasAccess(
  event: H3Event,
  username: string | undefined,
) {
  const { username: usernameFromToken, roles } = await getUserFromToken(event);

  if (!usernameFromToken || !username) {
    return false;
  }

  if (usernameFromToken === username) {
    return true;
  }

  return roles.some((role) => {
    return role === Role.ADMIN || role === Role.MODERATOR;
  });
}

/**
 * Проверяет, что пользователь имеет роль ADMIN или MODERATOR.
 * При отсутствии прав выбрасывает ошибку 403.
 *
 * @param user Объект пользователя.
 * @param user.roles Список ролей пользователя.
 */
export function assertAdminAccess(user: { roles: string[] }): void {
  if (
    !user.roles.includes(Role.ADMIN)
    && !user.roles.includes(Role.MODERATOR)
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ запрещен',
    });
  }
}
