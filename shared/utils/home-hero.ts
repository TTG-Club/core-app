import type { HomeHeroMediaKind, HomeHeroSettings } from '../types/home-hero';

import { z } from 'zod';

import { HOME_HERO_VIDEO_TYPES } from '../consts/home-hero';
import { IMAGE_UPLOAD_TYPES } from '../consts/upload';

/**
 * Схема настройки фона шапки главной. Одна на обе стороны: сервер проверяет
 * ей JSON из хранилища, клиент — ответ API.
 */
export const homeHeroSettingsSchema: z.ZodType<HomeHeroSettings> = z.object({
  media: z
    .object({
      url: z.string().startsWith('/s3/'),
      kind: z.enum(['image', 'video']),
    })
    .nullable(),
});

/**
 * Вид фона шапки главной по MIME-типу файла.
 *
 * @param mimeType тип файла
 * @returns `image` или `video`; `null` — такой файл фоном поставить нельзя
 */
export function getHomeHeroMediaKind(
  mimeType: string,
): HomeHeroMediaKind | null {
  if (IMAGE_UPLOAD_TYPES.includes(mimeType)) {
    return 'image';
  }

  if (HOME_HERO_VIDEO_TYPES.includes(mimeType)) {
    return 'video';
  }

  return null;
}
