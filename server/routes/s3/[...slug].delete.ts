import { StatusCodes } from 'http-status-codes';

import { Role } from '~/shared/types';

import { S3Service } from '#server/domain/s3/service';

import type { H3Event } from 'h3';

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const [, username] = slug.split('/');

  if (!isUserHasAccess(event, username)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  return S3Service.delete(slug);
});

function isUserHasAccess(event: H3Event, username: string | undefined) {
  const { username: usernameFromToken, roles } = getUserFromToken(event);

  if (!usernameFromToken || !username) {
    return false;
  }

  if (usernameFromToken === username) {
    return true;
  }

  return roles.some((role) => {
    return role.name === Role.ADMIN || role.name === Role.MODERATOR;
  });
}
