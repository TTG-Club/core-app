import { z } from 'zod';

import { VTTG_COMPENDIUM_CHANNELS } from '#shared/consts';

/** Параметр роута версии компендиума: канал dev или prod. */
export const vttgCompendiumChannelParamsSchema = z.object({
  channel: z.enum(VTTG_COMPENDIUM_CHANNELS),
});

/** Тело подъёма версии; что она выше текущей, проверяет core-api канала. */
export const vttgCompendiumVersionBodySchema = z.object({
  version: z.number().int().nonnegative(),
});

/** Тело ошибки core-api: берём только текст причины для админа. */
export const vttgCompendiumApiErrorBodySchema = z.object({
  message: z.string().min(1),
});
