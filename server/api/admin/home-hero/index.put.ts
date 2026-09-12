import type { HomeHeroSettings } from '#shared/types';

import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';

import {
  HOME_HERO_ERROR_LOG,
  HOME_HERO_UPLOAD_SECTION,
  replaceHomeHeroMedia,
} from '#server/domain/home-hero';
import { getFileForUpload, readUploadFormFile } from '#server/domain/s3';
import { assertAdminRole } from '#server/utils/getUser';
import {
  HOME_HERO_UNSUPPORTED_TYPE_MESSAGE,
  HOME_HERO_VIDEO_MAX_BYTES,
  HOME_HERO_VIDEO_TOO_LARGE_MESSAGE,
} from '#shared/consts';
import { getHomeHeroMediaKind } from '#shared/utils';

/**
 * Ставит свой фон шапки главной — картинку или видео webm. Картинка проходит
 * общий компрессор загрузок, видео уходит в хранилище как есть. Прежний файл
 * фона удаляется после сохранения нового.
 */
export default defineEventHandler(async (event): Promise<HomeHeroSettings> => {
  await assertAdminRole(event);

  const { username } = await getUserFromToken(event);
  const file = await readUploadFormFile(event);
  const kind = file.type ? getHomeHeroMediaKind(file.type) : null;

  if (!kind) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: HOME_HERO_UNSUPPORTED_TYPE_MESSAGE,
      }),
    );
  }

  if (kind === 'video' && file.data.byteLength > HOME_HERO_VIDEO_MAX_BYTES) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: HOME_HERO_VIDEO_TOO_LARGE_MESSAGE,
      }),
    );
  }

  try {
    const fileForUpload = await getCompressed(
      getFileForUpload(HOME_HERO_UPLOAD_SECTION, username, file),
    );

    return await replaceHomeHeroMedia(fileForUpload, kind);
  } catch (error) {
    consola.error(HOME_HERO_ERROR_LOG, error);

    if (error instanceof H3Error) {
      throw error;
    }

    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
