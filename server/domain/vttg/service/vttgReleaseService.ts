import type { VttgDesktopRelease } from '#shared/types';

import ms from 'ms';
import { z } from 'zod';

import { parseUpdateManifest } from '../utils';

/** Имя манифеста electron-updater в канале обновлений. */
const UPDATE_MANIFEST_FILE = 'latest.yml';

/**
 * Сколько Nitro держит разобранный манифест (сек). Канал обновлений один на всех
 * пользователей, а релизы выходят не чаще пары раз в день — этого хватает, чтобы
 * новая версия появилась на сайте сама, но профиль не дёргал S3 на каждый рендер.
 */
const RELEASE_CACHE_MAX_AGE_SECONDS = ms('10m') / 1000;

/** Таймаут запроса манифеста: он крошечный, ждать долго незачем. */
const MANIFEST_REQUEST_TIMEOUT = ms('10s');

/**
 * Схема манифеста `latest.yml`. Берём только то, что нужно сайту: версию, имя
 * установщика, дату публикации и размер файла из списка артефактов.
 */
const updateManifestSchema = z.object({
  version: z.string().min(1),
  path: z.string().min(1),
  releaseDate: z.string().min(1).optional(),
  files: z
    .array(
      z.object({
        url: z.string().min(1),
        size: z.coerce.number().int().positive().optional(),
      }),
    )
    .optional(),
});

/**
 * Базовый адрес канала обновлений VTTG — всегда со слэшем на конце, чтобы имя
 * файла приклеивалось без сюрпризов.
 */
function getUpdateChannelUrl(): string {
  const {
    vttg: { desktopUpdateUrl },
  } = useRuntimeConfig();

  if (!desktopUpdateUrl) {
    throw new Error('[VTTG] Update channel url is not set');
  }

  return desktopUpdateUrl.endsWith('/')
    ? desktopUpdateUrl
    : `${desktopUpdateUrl}/`;
}

/**
 * Читает манифест канала обновлений и превращает его в описание последней сборки.
 * Тот же файл читает сам десктоп через electron-updater, поэтому сайт и
 * приложение всегда показывают одну и ту же версию.
 */
async function loadDesktopRelease(): Promise<VttgDesktopRelease> {
  const channelUrl = getUpdateChannelUrl();

  const manifest = await $fetch<string>(
    `${channelUrl}${UPDATE_MANIFEST_FILE}`,
    {
      method: 'GET',
      responseType: 'text',
      timeout: MANIFEST_REQUEST_TIMEOUT,
      retry: 1,
    },
  );

  const parsed = updateManifestSchema.safeParse(parseUpdateManifest(manifest));

  if (!parsed.success) {
    throw new Error('[VTTG] Update manifest has unexpected format');
  }

  const { version, path, releaseDate, files } = parsed.data;

  // Размер берём у артефакта, на который указывает `path` — в манифесте рядом
  // лежит ещё и blockmap для дифф-загрузки, его вес пользователю не нужен.
  const installer = files?.find((file) => file.url === path);

  return {
    version,
    fileName: path,
    downloadUrl: `${channelUrl}${encodeURIComponent(path)}`,
    size: installer?.size ?? null,
    releaseDate: releaseDate ?? null,
  };
}

/**
 * Последняя сборка десктопного VTTG с кэшем Nitro. Версия нигде не хранится в
 * приложении: она каждый раз приходит из манифеста, поэтому после релиза сайт
 * начинает отдавать новый установщик сам, без правок кода и без деплоя.
 */
export const getVttgDesktopRelease = defineCachedFunction(loadDesktopRelease, {
  name: 'vttg',
  getKey: () => 'desktop-release',
  maxAge: RELEASE_CACHE_MAX_AGE_SECONDS,
});
