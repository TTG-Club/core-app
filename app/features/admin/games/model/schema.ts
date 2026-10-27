import type { AdminGameStatistics } from './types';

import { z as validation } from 'zod';

const adminGameStatisticsSchema: validation.ZodType<AdminGameStatistics> =
  validation
    .object({
      total: validation.number().int().nonnegative(),
      completed: validation.number().int().nonnegative(),
    })
    .refine((statistics) => statistics.completed <= statistics.total);

/** Проверяет счётчики игр, полученные от find-game-api. */
export function parseAdminGameStatistics(
  payload: unknown,
): AdminGameStatistics {
  return adminGameStatisticsSchema.parse(payload);
}
