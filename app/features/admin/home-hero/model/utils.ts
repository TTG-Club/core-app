import type { HomeHeroMedia } from '#shared/types';

import {
  HOME_HERO_UNSUPPORTED_TYPE_MESSAGE,
  HOME_HERO_VIDEO_MAX_BYTES,
  HOME_HERO_VIDEO_TOO_LARGE_MESSAGE,
} from '#shared/consts';
import { getHomeHeroMediaKind } from '#shared/utils';
import { z } from '~/utils/zod';

import {
  HOME_HERO_PREVIEW_KIND_QUERY,
  HOME_HERO_PREVIEW_ROUTE,
  HOME_HERO_PREVIEW_URL_QUERY,
} from './constants';

const previewMediaSchema = z.object({
  url: z.string().min(1),
  kind: z.enum(['image', 'video']),
});

/**
 * Почему файл нельзя поставить фоном шапки. Та же проверка есть на сервере —
 * здесь она избавляет от отправки заведомо негодного файла.
 *
 * @param file выбранный файл
 * @returns текст ошибки; `null` — файл подходит
 */
export function getHomeHeroFileError(file: File): string | null {
  const kind = getHomeHeroMediaKind(file.type);

  if (!kind) {
    return HOME_HERO_UNSUPPORTED_TYPE_MESSAGE;
  }

  if (kind === 'video' && file.size > HOME_HERO_VIDEO_MAX_BYTES) {
    return HOME_HERO_VIDEO_TOO_LARGE_MESSAGE;
  }

  return null;
}

/**
 * Адрес страницы превью. С черновиком — ссылка на него в параметрах, без
 * черновика шапка во фрейме покажет сохранённый фон.
 *
 * @param draft черновик фона
 * @returns адрес для фрейма
 */
export function getHomeHeroPreviewSrc(draft: HomeHeroMedia | null): string {
  if (!draft) {
    return HOME_HERO_PREVIEW_ROUTE;
  }

  const previewQuery = new URLSearchParams({
    [HOME_HERO_PREVIEW_URL_QUERY]: draft.url,
    [HOME_HERO_PREVIEW_KIND_QUERY]: draft.kind,
  });

  return `${HOME_HERO_PREVIEW_ROUTE}?${previewQuery.toString()}`;
}

/**
 * Черновик фона из параметров адреса страницы превью. Принимается только
 * локальная ссылка `blob:` этого же сайта — её создаёт админка из выбранного
 * файла, и чужую картинку через адрес подсунуть нельзя.
 *
 * @param url значение параметра ссылки
 * @param kind значение параметра вида
 * @param origin origin сайта
 * @returns черновик; `undefined` — параметров нет или они негодные
 */
export function getHomeHeroPreviewMedia(
  url: unknown,
  kind: unknown,
  origin: string,
): HomeHeroMedia | undefined {
  const parsedMedia = previewMediaSchema.safeParse({ url, kind });

  if (
    !parsedMedia.success
    || !parsedMedia.data.url.startsWith(`blob:${origin}/`)
  ) {
    return undefined;
  }

  return parsedMedia.data;
}
