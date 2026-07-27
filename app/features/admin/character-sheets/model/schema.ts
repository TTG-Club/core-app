import type { AdminCharacterSheetStats } from './types';

import * as z from 'zod';

const adminCharacterSheetStatsSchema: z.ZodType<AdminCharacterSheetStats> =
  z.object({
    total: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
  });

/**
 * Проверяет ответ core-api со статистикой листов персонажей.
 */
export function parseAdminCharacterSheetStats(
  payload: unknown,
): AdminCharacterSheetStats {
  return adminCharacterSheetStatsSchema.parse(payload);
}
