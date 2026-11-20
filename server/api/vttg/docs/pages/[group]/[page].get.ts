import type { VttgDocsPage } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import {
  getVttgDocsChannels,
  getVttgDocsPage,
  VTTG_DOCS_ERROR_LOG,
  vttgDocsPageParamsSchema,
} from '#server/domain/vttg-docs';
import { vttgDocsChannelQuerySchema } from '#shared/utils';

/**
 * Страница документации VTTG: HTML тела, оглавление и соседние страницы.
 * Права на канал — как у оглавления. Страницы нет в оглавлении канала — 404.
 */
export default defineEventHandler(async (event): Promise<VttgDocsPage> => {
  const parsedQuery = vttgDocsChannelQuerySchema.safeParse(getQuery(event));

  const parsedParams = vttgDocsPageParamsSchema.safeParse(
    getRouterParams(event),
  );

  if (!parsedQuery.success || !parsedParams.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  const { channel } = parsedQuery.data;
  const channels = await getVttgDocsChannels(event);

  if (!channels.includes(channel)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  let page: VttgDocsPage | null;

  try {
    page = await getVttgDocsPage(
      channel,
      parsedParams.data.group,
      parsedParams.data.page,
    );
  } catch (error) {
    consola.error(VTTG_DOCS_ERROR_LOG, error);

    throw createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
  }

  if (!page) {
    throw createError(getErrorResponse(StatusCodes.NOT_FOUND));
  }

  return page;
});
