import type { VkIdPendingLogin, VkIdSession, VkVideoImage } from './types';

import { z } from 'zod';

/** Схема файла подключения редактора (после расшифровки). */
export const vkIdSessionSchema: z.ZodType<VkIdSession> = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.number(),
  deviceId: z.string().min(1),
  userId: z.string(),
  connectedAt: z.string(),
});

/** Схема cookie незавершённого входа. */
export const vkIdPendingLoginSchema: z.ZodType<VkIdPendingLogin> = z.object({
  state: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.url(),
});

/** Ошибка в ответе VK ID (обмен кода, продление). */
export const vkIdErrorResponseSchema = z.object({
  error: z.string(),
  // eslint-disable-next-line camelcase -- имя поля задаёт VK ID
  error_description: z.string().optional(),
});

/** Успешный ответ VK ID с ключами. */
export const vkIdTokenResponseSchema = z.object({
  // eslint-disable-next-line camelcase -- имя поля задаёт VK ID
  access_token: z.string().min(1),
  // eslint-disable-next-line camelcase -- имя поля задаёт VK ID
  refresh_token: z.string().min(1).optional(),
  // eslint-disable-next-line camelcase -- имя поля задаёт VK ID
  expires_in: z.coerce.number().positive(),
  // eslint-disable-next-line camelcase -- имя поля задаёт VK ID
  user_id: z.coerce.string().optional(),
});

/** Схема кадра ролика в ответе `video.get`. */
const vkVideoImageSchema: z.ZodType<VkVideoImage> = z.object({
  url: z.url(),
  width: z.number(),
});

/** Ответ `video.get`: кадры первого ролика или ошибка VK API. */
export const vkVideoGetResponseSchema = z.object({
  response: z
    .object({
      items: z.array(
        z.object({ image: z.array(vkVideoImageSchema).optional() }),
      ),
    })
    .optional(),
  error: z
    .object({
      // eslint-disable-next-line camelcase -- имя поля задаёт VK API
      error_code: z.number(),
      // eslint-disable-next-line camelcase -- имя поля задаёт VK API
      error_msg: z.string(),
    })
    .optional(),
});
