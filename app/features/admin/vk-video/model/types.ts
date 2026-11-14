import type { VK_VIDEO_CONNECT_RESULT } from '#shared/consts';

import type { VK_VIDEO_LOGIN_MESSAGE_TYPE } from './constants';

/** Итог входа, который окно входа сообщает открывшей его странице. */
export interface VkVideoLoginMessage {
  type: typeof VK_VIDEO_LOGIN_MESSAGE_TYPE;
  result: (typeof VK_VIDEO_CONNECT_RESULT)[keyof typeof VK_VIDEO_CONNECT_RESULT];
  reason: string | null;
}
