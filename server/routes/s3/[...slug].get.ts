import { StatusCodes } from 'http-status-codes';

import { S3Service } from '#server/domain/s3';

export default defineEventHandler(async (event) => {
  const rawPath = getRouterParam(event, 'slug');

  let path = rawPath ? decodeURIComponent(rawPath) : undefined;

  if (path?.startsWith('/')) {
    path = path.substring(1);
  }

  if (!path) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  // Пробрасываем Range-запрос в S3, чтобы браузер мог перематывать видео/аудио
  const range = getHeader(event, 'range');

  try {
    const file = await S3Service.get(path, range);

    if (!file?.Body) {
      return createError(getErrorResponse(StatusCodes.NOT_FOUND));
    }

    if (file.ContentType) {
      setHeader(event, 'content-type', file.ContentType);
    }

    if (file.CacheControl) {
      setHeader(event, 'cache-control', file.CacheControl);
    }

    setHeader(event, 'access-control-allow-origin', '*');
    // Сообщаем клиенту, что поддерживаем частичные запросы (перемотка)
    setHeader(event, 'accept-ranges', 'bytes');

    if (file.ContentLength != null) {
      setHeader(event, 'content-length', file.ContentLength);
    }

    if (range && file.ContentRange) {
      setResponseStatus(event, StatusCodes.PARTIAL_CONTENT);
      setHeader(event, 'content-range', file.ContentRange);
    }

    const body = file.Body as any;

    return sendStream(event, body);
  } catch (e) {
    if (!(e instanceof Error)) {
      consola.error('[S3 Service Error]: unknown error.', e);

      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }

    if (e.name === 'NoSuchKey') {
      throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
    }

    // Клиент запросил некорректный/недостижимый диапазон
    if (e.name === 'InvalidRange') {
      throw createError(
        getErrorResponse(StatusCodes.REQUESTED_RANGE_NOT_SATISFIABLE),
      );
    }

    consola.error('[S3 Service Error]:', e.name, e.message);

    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
