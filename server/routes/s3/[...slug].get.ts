import { StatusCodes } from 'http-status-codes';
import { S3Service } from '~~/server/services';

export default defineEventHandler(async (event) => {
  const rawPath = getRouterParam(event, 'slug');

  let path = rawPath ? decodeURIComponent(rawPath) : undefined;

  if (path?.startsWith('/')) {
    path = path.substring(1);
  }

  if (!path) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  try {
    const file = await S3Service.get(path);

    if (!file?.Body) {
      return createError(getErrorResponse(StatusCodes.NOT_FOUND));
    }

    setHeader(event, 'content-type', file.ContentType);
    setHeader(event, 'cache-control', file.CacheControl);

    const body = file.Body as any;

    return sendStream(event, body);
  } catch (e) {
    if (!(e instanceof Error)) {
      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }

    if (e.name === 'NoSuchKey') {
      throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
    }

    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
