import type { EventHandlerRequest } from 'h3';

import type { S3UploadFile, S3UploadResponse } from '#server/domain/s3';

import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod/v4';

import {
  getFileForUpload,
  readUploadFormFile,
  S3Service,
} from '#server/domain/s3';

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
    const { username } = await getUserFromToken(event);
    const file = await readUploadFormFile(event);

    let maxSize: number | undefined;
    let section: string | undefined;

    try {
      const query = await getValidatedQuery(event, requestSchema.parse);

      maxSize = Number(query?.maxSize);

      if (!Number.isFinite(maxSize)) {
        maxSize = undefined;
      }

      section = query?.section;
    } catch (error) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Максимальный размер имеет неверный формат',
        }),
      );
    }

    let fileForUpload: S3UploadFile;

    try {
      fileForUpload = await getCompressed(
        getFileForUpload(section, username, file),
        maxSize,
      );
    } catch (error) {
      consola.error(error);

      if (error instanceof H3Error) {
        throw error;
      }

      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }

    return S3Service.upload(fileForUpload);
  },
);
