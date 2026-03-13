import { StatusCodes } from 'http-status-codes';

import { S3Service } from '#server/domain/s3';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const [, username] = slug.split('/');

  if (!(await isUserHasAccess(event, username))) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  return S3Service.delete(slug);
});
