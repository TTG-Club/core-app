import type { VttgDocsIndexResponse } from '#shared/types';

import { StatusCodes } from 'http-status-codes';

import {
  getVttgDocsChannels,
  getVttgDocsIndex,
  isVttgDocsChannelPublic,
  VTTG_DOCS_ERROR_LOG,
} from '#server/domain/vttg-docs';
import { vttgDocsChannelQuerySchema } from '#shared/utils';

/**
 * Оглавление канала документации VTTG (`?channel=release|dev`), список
 * каналов, доступных посетителю, и открыт ли канал всем. Кому виден какой
 * канал — по настройке раздела в админке; закрытый канал — 403.
 */
export default defineEventHandler(
  async (event): Promise<VttgDocsIndexResponse> => {
    const parsedQuery = vttgDocsChannelQuerySchema.safeParse(getQuery(event));

    if (!parsedQuery.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    const { channel } = parsedQuery.data;
    const channels = await getVttgDocsChannels(event);

    if (!channels.includes(channel)) {
      throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
    }

    try {
      const [index, isPublic] = await Promise.all([
        getVttgDocsIndex(channel),
        isVttgDocsChannelPublic(channel),
      ]);

      return { index, channels, isPublic };
    } catch (error) {
      consola.error(VTTG_DOCS_ERROR_LOG, error);

      throw createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
    }
  },
);
