import type { VkVideoConnectionStatus } from '#shared/types';

import {
  deleteVkIdSession,
  getVkVideoConnectionStatus,
  getVkVideoEditor,
} from '#server/domain/vk-video';

/**
 * Отключает ВК текущего редактора: гасит его ключ в ВК и удаляет у нас.
 * Уже взятые обложки остаются — это обычные загруженные картинки.
 */
export default defineEventHandler(
  async (event): Promise<VkVideoConnectionStatus> => {
    const username = await getVkVideoEditor(event);

    await deleteVkIdSession(username);

    return getVkVideoConnectionStatus(username);
  },
);
