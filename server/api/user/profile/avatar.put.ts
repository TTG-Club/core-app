import type { UserAvatarResponse } from '#server/domain/user-avatar';

import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';

import { readUploadFormFile } from '#server/domain/s3';
import {
  getAvatarOwner,
  replaceUserAvatar,
  USER_AVATAR_ERROR_LOG,
  USER_AVATAR_MAX_BYTES,
  USER_AVATAR_TOO_LARGE_MESSAGE,
  USER_AVATAR_UNSUPPORTED_TYPE_MESSAGE,
} from '#server/domain/user-avatar';
import { IMAGE_UPLOAD_TYPES } from '#shared/consts';

/**
 * Ставит текущему пользователю аватарку. Файл сжимается в квадратный webp,
 * ссылка сохраняется в core-api, прежний файл удаляется после сохранения.
 */
export default defineEventHandler(
  async (event): Promise<UserAvatarResponse> => {
    const owner = await getAvatarOwner(event);
    const file = await readUploadFormFile(event);

    if (!file.type || !IMAGE_UPLOAD_TYPES.includes(file.type)) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: USER_AVATAR_UNSUPPORTED_TYPE_MESSAGE,
        }),
      );
    }

    if (file.data.byteLength > USER_AVATAR_MAX_BYTES) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: USER_AVATAR_TOO_LARGE_MESSAGE,
        }),
      );
    }

    try {
      return await replaceUserAvatar(owner, file.data);
    } catch (error) {
      // Ожидаемый отказ уже несёт статус и текст для пользователя.
      if (error instanceof H3Error) {
        throw error;
      }

      consola.error(USER_AVATAR_ERROR_LOG, error);

      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  },
);
