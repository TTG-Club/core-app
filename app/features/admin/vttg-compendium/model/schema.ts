import type { VttgCompendiumVersion } from './types';

import { z as validation } from 'zod';

const vttgCompendiumVersionSchema: validation.ZodType<VttgCompendiumVersion> =
  validation.object({
    version: validation.number().int().nonnegative(),
    updatedAt: validation.string().nullable(),
    updatedBy: validation.string().nullable(),
    rebuild: validation.object({
      status: validation.enum(['IDLE', 'RUNNING', 'DONE', 'FAILED']),
      startedAt: validation.string().nullable(),
      finishedAt: validation.string().nullable(),
      error: validation.string().nullable(),
    }),
  });

/** Проверяет версию компендиума VTTG, полученную от core-api. */
export function parseVttgCompendiumVersion(
  payload: unknown,
): VttgCompendiumVersion {
  return vttgCompendiumVersionSchema.parse(payload);
}
