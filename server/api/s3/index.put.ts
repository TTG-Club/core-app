import { StatusCodes } from 'http-status-codes';
import type { S3UploadFile, S3UploadResponse } from '~~/server/types/s3';
import { z } from 'zod';
import type { EventHandlerRequest } from 'h3';
import { H3Error } from 'h3';
import { toNumber } from 'lodash-es';
import { getErrorResponse } from '~~/shared/utils';

const requestSchema = z
  .object({
    path: z
      .string()
      .regex(/^[a-z0-9/][a-z0-9-/]+[a-z0-9/]$/i)
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

    let path: string | undefined;
    let maxSize: number | undefined;

    try {
      const query = await getValidatedQuery(event, requestSchema.parse);

      path = query?.path;
      maxSize = toNumber(query?.maxSize);
    } catch (err) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message:
            'Неправильный формат пути. Путь может состоять только из латинских букв, цифр, дефиса. В начале и конце пути нельзя использовать дефис. Подкаталоги разделяются косой чертой.',
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
      fileForUpload = getFileForUpload(file, username, path);
    } catch (err) {
      if (err instanceof H3Error) {
        throw err;
      }

      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }

    if (fileForUpload.type.startsWith('image/')) {
      return uploadImage(fileForUpload, maxSize);
    }

    return uploadDefault(fileForUpload);
  },
);
