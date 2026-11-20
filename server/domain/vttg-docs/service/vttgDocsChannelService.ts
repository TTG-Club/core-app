import type { VttgDocsChannel } from '#shared/consts';
import type {
  VttgDocsIndex,
  VttgDocsPage,
  VttgDocsPageLink,
} from '#shared/types';

import type { VttgDocsManifest } from '../model';
import type { RenderedVttgDocsPage } from '../utils';

import { FetchError } from 'ofetch';

import {
  VTTG_DOCS_BASE_URL_MISSING_ERROR,
  VTTG_DOCS_INDEX_CACHE_MAX_AGE_SECONDS,
  VTTG_DOCS_INDEX_CACHE_NAME,
  VTTG_DOCS_INDEX_CHANNEL_MISMATCH_ERROR,
  VTTG_DOCS_INDEX_FILE,
  VTTG_DOCS_INDEX_INVALID_ERROR,
  VTTG_DOCS_INDEX_INVALID_LOG,
  VTTG_DOCS_MISSING_STATUSES,
  VTTG_DOCS_PAGE_CACHE_MAX_AGE_SECONDS,
  VTTG_DOCS_PAGE_CACHE_NAME,
  VTTG_DOCS_PAGE_FILE_EXTENSION,
  VTTG_DOCS_REQUEST_TIMEOUT,
  vttgDocsManifestSchema,
} from '../model';
import { renderVttgDocsMarkdown } from '../utils';

/**
 * Корень документации в канале обновлений — всегда со слэшем на конце.
 * Внутри папки каналов: `release/`, `dev/`.
 */
function getDocsBaseUrl(): string {
  const {
    vttg: { docsBaseUrl },
  } = useRuntimeConfig();

  if (!docsBaseUrl) {
    throw new Error(VTTG_DOCS_BASE_URL_MISSING_ERROR);
  }

  return docsBaseUrl.endsWith('/') ? docsBaseUrl : `${docsBaseUrl}/`;
}

/**
 * Читает текстовый файл канала.
 *
 * @param path путь от корня документации
 */
function fetchDocsFile(path: string): Promise<string> {
  return $fetch<string>(`${getDocsBaseUrl()}${path}`, {
    method: 'GET',
    responseType: 'text',
    timeout: VTTG_DOCS_REQUEST_TIMEOUT,
    retry: 1,
  });
}

/**
 * Превращает оглавление сборки VTTG в оглавление для сайта: пустые описания
 * сводятся к `null`.
 *
 * @param manifest разобранный `latest.json`
 */
function toDocsIndex(manifest: VttgDocsManifest): VttgDocsIndex {
  return {
    channel: manifest.channel,
    version: manifest.version,
    releaseDate: manifest.releaseDate ?? null,
    groups: manifest.groups.map((group) => ({
      slug: group.slug,
      title: group.title,
      description: group.description ?? null,
      pages: group.pages.map((page) => ({
        slug: page.slug,
        title: page.title,
        description: page.description ?? null,
      })),
    })),
  };
}

/**
 * Читает оглавление канала. `null` — канал ещё не выкладывался: на
 * отсутствующий ключ бакет отвечает 403.
 *
 * @param channel канал документации
 */
async function loadDocsIndex(
  channel: VttgDocsChannel,
): Promise<VttgDocsIndex | null> {
  let manifestText: string;

  try {
    manifestText = await fetchDocsFile(`${channel}/${VTTG_DOCS_INDEX_FILE}`);
  } catch (error) {
    if (
      error instanceof FetchError
      && error.statusCode
      && VTTG_DOCS_MISSING_STATUSES.includes(error.statusCode)
    ) {
      return null;
    }

    throw error;
  }

  const parsedManifest = vttgDocsManifestSchema.safeParse(
    JSON.parse(manifestText),
  );

  if (!parsedManifest.success) {
    consola.error(VTTG_DOCS_INDEX_INVALID_LOG, parsedManifest.error.issues);

    throw new Error(VTTG_DOCS_INDEX_INVALID_ERROR);
  }

  // Канал внутри файла должен совпадать с папкой: иначе dev-доки могли бы
  // оказаться в релизном канале, открытом всем.
  if (parsedManifest.data.channel !== channel) {
    throw new Error(VTTG_DOCS_INDEX_CHANNEL_MISMATCH_ERROR);
  }

  return toDocsIndex(parsedManifest.data);
}

/**
 * Стоит ли держать в кеше прочитанное оглавление: только настоящее, а не
 * «канала ещё нет».
 *
 * @param cachedIndex значение из кеша
 */
function isVttgDocsIndexCached(
  cachedIndex: VttgDocsIndex | null | undefined,
): boolean {
  return Boolean(cachedIndex);
}

/**
 * Оглавление канала с кешем Nitro: его читает каждый заход в раздел.
 * `null` — канал ещё не выкладывался.
 */
export const getVttgDocsIndex = defineCachedFunction(loadDocsIndex, {
  name: VTTG_DOCS_INDEX_CACHE_NAME,
  getKey: (channel: VttgDocsChannel) => channel,
  maxAge: VTTG_DOCS_INDEX_CACHE_MAX_AGE_SECONDS,
  // «Канал ещё не выкладывался» не запоминается: иначе первая выкладка VTTG
  // появилась бы на сайте только через срок кеша (а с `swr` — ещё на один
  // запрос позже). Пока канала нет, файл перечитывается на каждый заход.
  validate: (cacheEntry) => isVttgDocsIndexCached(cacheEntry.value),
});

/**
 * Скачивает и собирает страницу. Версия входит в ключ кеша, а папка версии
 * после заливки не меняется, поэтому кеш долгий.
 *
 * @param channel канал
 * @param version версия из оглавления
 * @param groupSlug группа
 * @param pageSlug страница
 */
async function loadRenderedPage(
  channel: VttgDocsChannel,
  version: string,
  groupSlug: string,
  pageSlug: string,
): Promise<RenderedVttgDocsPage> {
  const pageFile = `${groupSlug}/${pageSlug}${VTTG_DOCS_PAGE_FILE_EXTENSION}`;
  const markdown = await fetchDocsFile(`${channel}/${version}/${pageFile}`);

  return renderVttgDocsMarkdown(markdown, channel, pageFile);
}

const getCachedRenderedPage = defineCachedFunction(loadRenderedPage, {
  name: VTTG_DOCS_PAGE_CACHE_NAME,
  getKey: (
    channel: VttgDocsChannel,
    version: string,
    groupSlug: string,
    pageSlug: string,
  ) => `${channel}:${version}:${groupSlug}:${pageSlug}`,
  maxAge: VTTG_DOCS_PAGE_CACHE_MAX_AGE_SECONDS,
});

/**
 * Страницы канала подряд — для ссылок «назад» и «дальше» через границы групп.
 *
 * @param index оглавление канала
 */
function flattenPages(index: VttgDocsIndex): VttgDocsPageLink[] {
  return index.groups.flatMap((group) =>
    group.pages.map((page) => ({
      groupSlug: group.slug,
      pageSlug: page.slug,
      title: page.title,
    })),
  );
}

/**
 * Страница документации, готовая к показу. `null` — канала нет или в его
 * оглавлении нет такой страницы.
 *
 * @param channel канал документации
 * @param groupSlug группа
 * @param pageSlug страница
 */
export async function getVttgDocsPage(
  channel: VttgDocsChannel,
  groupSlug: string,
  pageSlug: string,
): Promise<VttgDocsPage | null> {
  const index = await getVttgDocsIndex(channel);
  const group = index?.groups.find(({ slug }) => slug === groupSlug);
  const page = group?.pages.find(({ slug }) => slug === pageSlug);

  if (!index || !group || !page) {
    return null;
  }

  const { html, headings } = await getCachedRenderedPage(
    channel,
    index.version,
    groupSlug,
    pageSlug,
  );

  const orderedPages = flattenPages(index);

  const currentPosition = orderedPages.findIndex(
    (pageLink) =>
      pageLink.groupSlug === groupSlug && pageLink.pageSlug === pageSlug,
  );

  return {
    channel,
    version: index.version,
    releaseDate: index.releaseDate,
    group: { slug: group.slug, title: group.title },
    page,
    html,
    headings,
    previous: orderedPages[currentPosition - 1] ?? null,
    next: orderedPages[currentPosition + 1] ?? null,
  };
}
