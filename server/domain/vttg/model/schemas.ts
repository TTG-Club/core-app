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

/**
 * Тело запроса справки о личности для мира VTTG: адрес мира. Что это именно
 * адрес без пути и параметров, проверяет auth-service — он же её подписывает.
 */
export const vttgAuthorizeBodySchema = z.object({
  audience: z.string().trim().min(1).max(255),
});

/** Ответ auth-service со справкой: берём только саму справку. */
export const vttgIdentityTicketSchema = z.object({
  ticket: z.string().min(1),
});
