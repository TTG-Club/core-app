import type { EventHandlerRequest } from 'h3';

import type { S3UploadResponse } from '#server/domain/s3';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod/v4';

import { getFileKey, S3Service } from '#server/domain/s3';

const requestSchema = z.object({
  url: z.string().startsWith('/s3/'),
});

interface Request extends EventHandlerRequest {
  body?: z.infer<typeof requestSchema>;
}

/**
 * Имя файла без прежнего временного префикса — ключ копии получит свой.
 *
 * @param filename имя файла из ключа исходного объекта.
 * @returns имя файла для ключа копии.
 */
function getSourceFilename(filename: string): string {
  return filename.replace(/^\d+-/, '');
}

/**
 * Копия загруженного файла с новым ключом. Нужна, когда на одну картинку
 * начинают ссылаться две сущности (например, копия листа персонажа) и удаление
 * файла у одной не должно ломать другую.
 */
export default defineEventHandler<Request, Promise<S3UploadResponse>>(
  async (event) => {
    const parsed = requestSchema.safeParse(await readBody<unknown>(event));

    if (!parsed.success) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Некорректная ссылка на файл',
        }),
      );
    }

    const sourceKey = parsed.data.url.replace('/s3/', '');
    const segments = sourceKey.split('/');
    const [section, username, filename] = segments;

    if (segments.length !== 3 || !section || !username || !filename) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Некорректная ссылка на файл',
        }),
      );
    }

    if (!(await isUserHasAccess(event, username))) {
      throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
    }

    const targetKey = getFileKey(
      section,
      username,
      getSourceFilename(filename),
    );

    await S3Service.copy(sourceKey, targetKey);

    return {
      filename,
      url: `/s3/${targetKey}`,
    };
  },
);
