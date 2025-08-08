import { StatusCodes } from 'http-status-codes';

import { S3Service } from '~~/server/services';
import type { H3Event } from 'h3';
import { Role } from '~/shared/types';

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const [, username] = slug.split('/');

  try {
    checkUserAccess(event, username);
  } catch (e) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  return S3Service.delete(slug);
});

function checkUserAccess(event: H3Event, username: string) {
  const { username: usernameFromToken, roles } = getUserFromToken(event);

  if (!usernameFromToken) {
    throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
  }

  if (usernameFromToken === username) {
    return;
  }

  if (
    !roles.some(
      (role) => role.name === Role.ADMIN || role.name === Role.MODERATOR,
    )
  ) {
    return;
  }

  throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
}
