import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod/v4';
import { S3Service } from '~~/server/services';

import type { EventHandlerRequest } from 'h3';
import type { S3UploadFile, S3UploadResponse } from '~~/server/types/s3';

const requestSchema = z
  .object({
    section: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]+[a-z0-9]$/)
      .optional(),
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
    let section: string | undefined;

    try {
      const query = await getValidatedQuery(event, requestSchema.parse);

      maxSize = Number(query?.maxSize);

      if (!Number.isFinite(maxSize)) {
        maxSize = undefined;
      }

      section = query?.section;
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
