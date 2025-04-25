import { StatusCodes } from 'http-status-codes';

import { S3Service } from '~~/server/services';

export default defineEventHandler((event) => {
  const { username } = getUserFromToken(event);
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const [, user] = slug.split('/');

  if (!user || getSlug(username) !== user) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  return S3Service.delete(slug);
});
