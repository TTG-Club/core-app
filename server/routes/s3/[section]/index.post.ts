import { StatusCodes } from 'http-status-codes';
import type { S3UploadFile, S3UploadResponse } from '~~/server/types/s3';
import { z } from 'zod';
import type { EventHandlerRequest } from 'h3';
import { H3Error } from 'h3';
import { toSafeInteger } from 'lodash-es';
import { S3Service } from '~~/server/services';

const requestSchema = z
  .object({
    maxSize: z.string().regex(/^\d+$/).optional(),
  })
  .optional();

interface Request extends EventHandlerRequest {
  query?: z.infer<typeof requestSchema>;
}

export default defineEventHandler<Request, Promise<S3UploadResponse>>(
  async (event) => {
    const { username } = getUserFromToken(event);
    const form = await readMultipartFormData(event);

    let maxSize: number | undefined;

    try {
      const query = await getValidatedQuery(event, requestSchema.parse);

      maxSize = toSafeInteger(query?.maxSize);
    } catch (err) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Максимальный размер имеет неверный формат',
        }),
      );
    }

    if (!form) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Неизвестный формат данных',
        }),
      );
    }

    if (form.length > 1) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'За один раз можно загрузить лишь один файл',
        }),
      );
    }

    const file = form.find((item) => item.name === 'file');

    if (!file) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Отсутствуют файлы для загрузки',
        }),
      );
    }

    let fileForUpload: S3UploadFile;

    const section = getRouterParam(event, 'section');

    try {
      fileForUpload = await getCompressed(
        getFileForUpload(section, username, file),
        maxSize,
      );
    } catch (err) {
      console.error(err);

      if (err instanceof H3Error) {
        throw err;
      }

      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }

    return S3Service.upload(fileForUpload);
  },
);
