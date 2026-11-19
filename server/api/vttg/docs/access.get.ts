import type { VttgDocsAccess } from '#shared/types';

import { getVttgDocsChannels } from '#server/domain/vttg-docs';

/**
 * Каналы документации VTTG, открытые посетителю. По нему меню сайта решает,
 * показывать ли пункт «Документация» и в какой канал вести.
 */
export default defineEventHandler(
  async (event): Promise<VttgDocsAccess> => ({
    channels: await getVttgDocsChannels(event),
  }),
);
