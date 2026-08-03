import type { AdminOnlineStatsResponse } from './types';

import * as z from 'zod';

const adminOnlineCountersSchema = z.object({
  guests: z.number().int().nonnegative(),
  registered: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const adminOnlineStatsResponseSchema: z.ZodType<AdminOnlineStatsResponse> =
  z.object({
    sites: z.array(
      adminOnlineCountersSchema.extend({
        siteId: z.string().min(1),
      }),
    ),
    total: adminOnlineCountersSchema,
    windowMinutes: z.number().int().positive(),
  });

/**
 * Проверяет ответ online-app со статистикой присутствия.
 */
export function parseAdminOnlineStats(
  payload: unknown,
): AdminOnlineStatsResponse {
  return adminOnlineStatsResponseSchema.parse(payload);
}
