import type { UserAvatarResponse } from '#server/domain/user-avatar';

import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';

import {
  getAvatarOwner,
  removeUserAvatar,
  USER_AVATAR_ERROR_LOG,
} from '#server/domain/user-avatar';

/** Убирает аватарку текущего пользователя вместе с файлом в хранилище. */
export default defineEventHandler(
  async (event): Promise<UserAvatarResponse> => {
    const owner = await getAvatarOwner(event);

    try {
      return await removeUserAvatar(owner);
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
