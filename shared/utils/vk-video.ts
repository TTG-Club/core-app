import type {
  VkVideoConnectionStatus,
  VkVideoCoverRequest,
  VkVideoCoverResponse,
  VkVideoLoginStart,
} from '../types/vk-video';

import { z } from 'zod';

import { S3_URL_PREFIX } from '../consts/upload';

/** Схема состояния подключения ВК: сервер отдаёт, клиент проверяет. */
export const vkVideoConnectionStatusSchema: z.ZodType<VkVideoConnectionStatus> =
  z.object({
    connected: z.boolean(),
    userId: z.string().nullable(),
    connectedAt: z.string().nullable(),
  });

/** Схема ответа на начало входа через VK ID. */
export const vkVideoLoginStartSchema: z.ZodType<VkVideoLoginStart> = z.object({
  authorizeUrl: z.url(),
});

/**
 * Схема запроса обложки из ролика. Раздел и предел размера — как у формы
 * загрузки обложки (`/s3/upload`).
 */
export const vkVideoCoverRequestSchema: z.ZodType<VkVideoCoverRequest> =
  z.object({
    ownerId: z.string().regex(/^-?\d+$/),
    videoId: z.string().regex(/^\d+$/),
    hash: z.string().regex(/^\w+$/).nullable(),
    section: z.string().regex(/^[a-z0-9][a-z0-9-]+[a-z0-9]$/),
    maxSize: z.number().int().positive().optional(),
  });

/** Схема взятой обложки: файл в нашем хранилище. */
export const vkVideoCoverResponseSchema: z.ZodType<VkVideoCoverResponse> =
  z.object({
    filename: z.string(),
    url: z.string().startsWith(S3_URL_PREFIX),
  });
