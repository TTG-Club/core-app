import type { VttgDocsChannel } from '#shared/consts';
import type { VttgDocsIndexResponse, VttgDocsPage } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import { VTTG_DOCS_API_PATH, VTTG_DOCS_PAGES_API_PATH } from '#shared/consts';

import { vttgDocsIndexResponseSchema, vttgDocsPageSchema } from './schemas';

type Fetcher = ReturnType<typeof useRequestFetch>;

/** Почему раздел не показал содержимое — от этого зависит текст заглушки. */
export type VttgDocsLoadFailure = 'forbidden' | 'not-found' | 'error';

/**
 * Читает оглавление канала.
 *
 * @param requestFetch `$fetch` с куками запроса — на сервере нужен для прав
 * @param channel канал документации
 */
export async function fetchVttgDocsIndex(
  requestFetch: Fetcher,
  channel: VttgDocsChannel,
): Promise<VttgDocsIndexResponse> {
  return vttgDocsIndexResponseSchema.parse(
    await requestFetch<unknown>(VTTG_DOCS_API_PATH, { query: { channel } }),
  );
}

/**
 * Читает страницу документации.
 *
 * @param requestFetch `$fetch` с куками запроса
 * @param channel канал документации
 * @param groupSlug группа
 * @param pageSlug страница
 */
export async function fetchVttgDocsPage(
  requestFetch: Fetcher,
  channel: VttgDocsChannel,
  groupSlug: string,
  pageSlug: string,
): Promise<VttgDocsPage> {
  return vttgDocsPageSchema.parse(
    await requestFetch<unknown>(
      `${VTTG_DOCS_PAGES_API_PATH}/${encodeURIComponent(groupSlug)}/${encodeURIComponent(pageSlug)}`,
      { query: { channel } },
    ),
  );
}

/**
 * Сбой сети или сервиса, а не отказ в доступе или пропавшая страница — такой
 * запрос имеет смысл повторить.
 *
 * @param failure вид сбоя
 */
export function isVttgDocsRetryableFailure(
  failure: VttgDocsLoadFailure,
): boolean {
  return failure === 'error';
}

/**
 * Вид сбоя загрузки по ошибке запроса.
 *
 * @param error ошибка `useAsyncData`
 */
export function getVttgDocsLoadFailure(error: unknown): VttgDocsLoadFailure {
  // И FetchError, и NuxtError из useAsyncData несут код ответа в statusCode.
  const statusCode =
    error instanceof Error && 'statusCode' in error
      ? error.statusCode
      : undefined;

  if (
    statusCode === StatusCodes.FORBIDDEN
    || statusCode === StatusCodes.UNAUTHORIZED
  ) {
    return 'forbidden';
  }

  if (statusCode === StatusCodes.NOT_FOUND) {
    return 'not-found';
  }

  return 'error';
}
