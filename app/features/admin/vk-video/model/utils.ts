import type { VkVideoId } from '#shared/types';

import type { VkVideoLoginMessage } from './types';

import { z } from 'zod';

import { VK_VIDEO_CONNECT_RESULT } from '#shared/consts';

import { VK_VIDEO_LOGIN_MESSAGE_TYPE } from './constants';

/** Схема сообщения окна входа: данные `postMessage` — внешние. */
const vkVideoLoginMessageSchema: z.ZodType<VkVideoLoginMessage> = z.object({
  type: z.literal(VK_VIDEO_LOGIN_MESSAGE_TYPE),
  result: z.enum([
    VK_VIDEO_CONNECT_RESULT.connected,
    VK_VIDEO_CONNECT_RESULT.error,
  ]),
  reason: z.string().nullable(),
});

/**
 * Разбирает сообщение окна входа ВК.
 *
 * @param messageData данные события `message`
 * @returns итог входа или `null`, если сообщение не от окна входа
 */
export function parseVkVideoLoginMessage(
  messageData: unknown,
): VkVideoLoginMessage | null {
  const parsed = vkVideoLoginMessageSchema.safeParse(messageData);

  return parsed.success ? parsed.data : null;
}

/**
 * Ключ ролика ВК — чтобы различать ролики и не брать кадр одного и того же
 * ролика повторно.
 *
 * @param video ролик ВК
 * @returns `владелец_id` или пустая строка, если ролика нет
 */
export function getVkVideoKey(video: VkVideoId | null): string {
  return video ? `${video.ownerId}_${video.videoId}` : '';
}
