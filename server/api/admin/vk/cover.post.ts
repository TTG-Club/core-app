import type { S3UploadResponse } from '#server/domain/s3';

import { H3Error } from 'h3';
import { StatusCodes } from 'http-status-codes';

import {
  getVkVideoEditor,
  uploadVkVideoCover,
  VK_VIDEO_LOG,
  VkVideoNoCoverError,
  VkVideoNotConnectedError,
} from '#server/domain/vk-video';
import {
  VK_VIDEO_COVER_NO_IMAGE_MESSAGE,
  VK_VIDEO_COVER_NOT_CONNECTED_MESSAGE,
} from '#shared/consts';
import { vkVideoCoverRequestSchema } from '#shared/utils';

/**
 * Берёт кадр ролика ВК обложкой записи — ключом ВК того, кто правит запись, —
 * и возвращает её адрес, как обычная загрузка обложки.
 */
export default defineEventHandler(async (event): Promise<S3UploadResponse> => {
  const username = await getVkVideoEditor(event);

  const parsed = vkVideoCoverRequestSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsed.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const { section, maxSize, ...video } = parsed.data;

  try {
    return await uploadVkVideoCover(username, video, section, maxSize);
  } catch (error) {
    if (error instanceof VkVideoNotConnectedError) {
      throw createError(
        getErrorResponse(StatusCodes.CONFLICT, {
          message: VK_VIDEO_COVER_NOT_CONNECTED_MESSAGE,
        }),
      );
    }

    if (error instanceof VkVideoNoCoverError) {
      consola.warn(VK_VIDEO_LOG, 'Кадр не получен:', error.message);

      throw createError(
        getErrorResponse(StatusCodes.UNPROCESSABLE_ENTITY, {
          message: VK_VIDEO_COVER_NO_IMAGE_MESSAGE,
        }),
      );
    }

    if (error instanceof H3Error) {
      throw error;
    }

    consola.error(VK_VIDEO_LOG, 'Обложка из ВК не загружена:', error);

    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
