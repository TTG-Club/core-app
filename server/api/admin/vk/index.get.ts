import type { VkVideoConnectionStatus } from '#shared/types';

import {
  getVkVideoConnectionStatus,
  getVkVideoEditor,
} from '#server/domain/vk-video';

/** Подключён ли ВК у текущего редактора (у каждого свой). */
export default defineEventHandler(
  async (event): Promise<VkVideoConnectionStatus> =>
    getVkVideoConnectionStatus(await getVkVideoEditor(event)),
);
