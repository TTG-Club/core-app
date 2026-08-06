import type { VttgBuild, VttgBuildFile, VttgBuildId } from '#shared/types';

import ms from 'ms';
import { z } from 'zod';

import { parseUpdateManifest } from '../utils';

/**
 * Сколько Nitro держит разобранный список сборок (сек). Канал обновлений один на
 * всех пользователей, а релизы выходят не чаще пары раз в день — этого хватает,
 * чтобы новая версия появилась на сайте сама, но профиль не дёргал S3 на каждый
 * рендер.
 */
const RELEASE_CACHE_MAX_AGE_SECONDS = ms('10m') / 1000;

/** Таймаут запроса манифеста: он крошечный, ждать долго незачем. */
const MANIFEST_REQUEST_TIMEOUT = ms('10s');

/** Папки канала: десктопные артефакты и серверные архивы лежат раздельно. */
const DESKTOP_PREFIX = 'desktop/';
const SERVER_PREFIX = 'server/';

/**
 * Схема манифеста electron-updater (`latest*.yml`). Берём только то, что нужно
 * сайту: версию, дату публикации и список артефактов с размерами.
 */
const electronManifestSchema = z.object({
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
 * Схема манифеста серверной сборки (`latest-node-linux-<arch>.json`,
 * `latest-docker.json`) — его пишет CI vttg рядом с архивом, потому что бакет
 * не листится и узнать версию архива больше неоткуда.
 */
const serverManifestSchema = z.object({
  version: z.string().min(1),
  file: z.string().min(1),
  size: z.coerce.number().int().positive().optional(),
  releaseDate: z.string().min(1).optional(),
});

/** Откуда читается состояние одной сборки. */
interface BuildSource {
  id: VttgBuildId;
  /** Папка канала, где лежат манифест и файлы сборки. */
  prefix: string;
  /** Имя файла манифеста в этой папке. */
  manifest: string;
  /**
   * Расширения артефактов, которые показываем человеку, в порядке отображения.
   * Нужны только манифестам electron-updater: там рядом с установщиком лежат
   * служебные `.blockmap` и mac-`.zip` (артефакт апдейтера, человеку нужен
   * `.dmg`). У серверных манифестов файл ровно один.
   */
  formats?: string[];
}

/**
 * Все сборки VTTG и их манифесты. Версия у каждой своя: платформы собираются
 * разными workflow и выкатываются с задержкой друг от друга, поэтому общей
 * версии у проекта нет.
 *
 * Источник, которого ещё нет в канале, отвечает 403 — сборка отдаётся пустой и
 * рисуется как «Скоро». Значит, новая платформа появляется на сайте сама, как
 * только CI зальёт её манифест, без правок кода и деплоя.
 */
const BUILD_SOURCES: BuildSource[] = [
  {
    id: 'windows-x64',
    prefix: DESKTOP_PREFIX,
    manifest: 'latest.yml',
    formats: ['exe'],
  },
  {
    id: 'mac-arm64',
    prefix: DESKTOP_PREFIX,
    manifest: 'latest-mac.yml',
    formats: ['dmg'],
  },
  {
    id: 'linux-x64',
    prefix: DESKTOP_PREFIX,
    manifest: 'latest-linux.yml',
    formats: ['AppImage', 'deb'],
  },
  {
    id: 'linux-arm64',
    prefix: DESKTOP_PREFIX,
    manifest: 'latest-linux-arm64.yml',
    formats: ['AppImage', 'deb'],
  },
  {
    id: 'server-linux-x64',
    prefix: SERVER_PREFIX,
    manifest: 'latest-node-linux-x64.json',
  },
  {
    id: 'server-linux-arm64',
    prefix: SERVER_PREFIX,
    manifest: 'latest-node-linux-arm64.json',
  },
  {
    id: 'docker',
    prefix: SERVER_PREFIX,
    manifest: 'latest-docker.json',
  },
];

/**
 * Корень канала обновлений VTTG — всегда со слэшем на конце, чтобы папка и имя
 * файла приклеивались без сюрпризов.
 */
function getUpdateChannelUrl(): string {
  const {
    vttg: { updateBaseUrl },
  } = useRuntimeConfig();

  if (!updateBaseUrl) {
    throw new Error('[VTTG] Update channel url is not set');
  }

  return updateBaseUrl.endsWith('/') ? updateBaseUrl : `${updateBaseUrl}/`;
}

/** Сборка, которой ещё нет в канале: в интерфейсе — выключенное «Скоро». */
function emptyBuild(id: VttgBuildId): VttgBuild {
  return { id, version: null, releaseDate: null, files: [] };
}

/**
 * Форматы серверных артефактов. Расширение из имени файла так просто не взять:
 * в нём есть версия с точками (`…-v0.9.327.tar.gz`), поэтому сверяемся с
 * известными суффиксами.
 */
const ARCHIVE_FORMATS = ['tar.gz', 'tgz', 'zip'];

/** Формат артефакта из списка допустимых или `null`, если файл служебный. */
function matchFormat(fileName: string, formats: string[]): string | null {
  return (
    formats.find((format) =>
      fileName.toLowerCase().endsWith(`.${format.toLowerCase()}`),
    ) ?? null
  );
}

/**
 * Разбирает манифест electron-updater. Артефакты фильтруются по списку форматов
 * и отдаются в его порядке: у Linux сначала AppImage (запускается без установки),
 * потом deb.
 */
function parseElectronManifest(
  source: BuildSource,
  baseUrl: string,
  raw: string,
): VttgBuild {
  const parsed = electronManifestSchema.safeParse(parseUpdateManifest(raw));

  if (!parsed.success) {
    throw new Error(`[VTTG] Manifest ${source.manifest} has unexpected format`);
  }

  const { version, path, releaseDate, files: artifacts } = parsed.data;
  const formats = source.formats ?? [];

  // Без списка артефактов остаётся корневой `path` — на него указывает сам
  // апдейтер, так что ссылка будет рабочая, просто без веса файла.
  const listed = artifacts ?? [{ url: path, size: undefined }];

  const files = listed
    .flatMap<VttgBuildFile>((artifact) => {
      const format = matchFormat(artifact.url, formats);

      return format
        ? [
            {
              format,
              fileName: artifact.url,
              downloadUrl: `${baseUrl}${encodeURIComponent(artifact.url)}`,
              size: artifact.size ?? null,
            },
          ]
        : [];
    })
    .sort(
      (first, second) =>
        formats.indexOf(first.format) - formats.indexOf(second.format),
    );

  return { id: source.id, version, releaseDate: releaseDate ?? null, files };
}

/** Разбирает JSON-манифест серверной сборки: в нём ровно один архив. */
function parseServerManifest(
  source: BuildSource,
  baseUrl: string,
  raw: string,
): VttgBuild {
  const parsed = serverManifestSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(`[VTTG] Manifest ${source.manifest} has unexpected format`);
  }

  const { version, file, size, releaseDate } = parsed.data;

  return {
    id: source.id,
    version,
    releaseDate: releaseDate ?? null,
    files: [
      {
        format: matchFormat(file, ARCHIVE_FORMATS) ?? 'archive',
        fileName: file,
        downloadUrl: `${baseUrl}${encodeURIComponent(file)}`,
        size: size ?? null,
      },
    ],
  };
}

/** Читает манифест одной сборки и превращает его в описание для интерфейса. */
async function loadBuild(
  source: BuildSource,
  channelUrl: string,
): Promise<VttgBuild> {
  const baseUrl = `${channelUrl}${source.prefix}`;

  const raw = await $fetch<string>(`${baseUrl}${source.manifest}`, {
    method: 'GET',
    responseType: 'text',
    timeout: MANIFEST_REQUEST_TIMEOUT,
    retry: 1,
  });

  return source.formats
    ? parseElectronManifest(source, baseUrl, raw)
    : parseServerManifest(source, baseUrl, raw);
}

/**
 * Состояние всех сборок VTTG в канале обновлений. Манифесты читаются
 * параллельно и независимо: недоступность одного (403 на ещё не вышедшую
 * платформу — штатная ситуация) не мешает отдать остальные.
 */
async function loadVttgBuilds(): Promise<VttgBuild[]> {
  // Адрес канала берём один раз и вне обработки ошибок: незаданный конфиг — это
  // поломка сервиса, а не «сборки ещё нет», и она должна дойти до роута.
  const channelUrl = getUpdateChannelUrl();

  let failed = 0;

  const builds = await Promise.all(
    BUILD_SOURCES.map(async (source) => {
      try {
        return await loadBuild(source, channelUrl);
      } catch (error) {
        failed += 1;

        consola.warn(
          `[VTTG] Manifest ${source.manifest} is unavailable:`,
          error,
        );

        return emptyBuild(source.id);
      }
    }),
  );

  // Упали все до единого — это уже не «платформы впереди», а недоступный канал.
  // Честнее отдать ошибку: интерфейс покажет «Повторить», а не тихое «Скоро»
  // напротив уже вышедших сборок.
  if (failed === BUILD_SOURCES.length) {
    throw new Error('[VTTG] Update channel is unreachable');
  }

  return builds;
}

/**
 * Сборки десктопного и серверного VTTG с кэшем Nitro. Версии нигде не хранятся
 * в приложении: они каждый раз приходят из манифестов канала обновлений — того
 * же, по которому обновляется само приложение. Поэтому после релиза сайт
 * начинает отдавать новую версию сам, без правок кода и без деплоя.
 */
export const getVttgBuilds = defineCachedFunction(loadVttgBuilds, {
  name: 'vttg',
  getKey: () => 'builds',
  maxAge: RELEASE_CACHE_MAX_AGE_SECONDS,
});
