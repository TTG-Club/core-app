import type { AdminOnlineStatsResponse } from './types';

import * as z from 'zod';

const adminOnlineCountersSchema = z.object({
  guests: z.number().int().nonnegative(),
  // Пока online-app не обновлён, числа играющих в ответе нет — карточка покажет прочерк.
  players: z.number().int().nonnegative().optional(),
  registered: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const adminOnlinePreferencePeriodSchema = z.object({
  days: z.number().int().positive(),
  preferences: z.record(
    z.string(),
    z.record(z.string(), z.number().int().nonnegative()),
  ),
});

const adminOnlineUsagePeriodSchema = z.object({
  activeDays: z.number().int().nonnegative(),
  activeMinutes: z.number().int().nonnegative(),
  days: z.number().int().positive(),
  returning: z.number().int().nonnegative(),
  users: z.number().int().nonnegative(),
  visitors: z.number().int().nonnegative(),
});

const adminOnlineFeatureUsageSchema = z.object({
  feature: z.string().min(1),
  periods: z.array(adminOnlineUsagePeriodSchema),
});

const adminOnlineStatsResponseSchema: z.ZodType<AdminOnlineStatsResponse> =
  z.object({
    sites: z.array(
      adminOnlineCountersSchema.extend({
        // Пока online-app не обновлён, срезов настроек в ответе нет — карточка покажет пустоту.
        preferences: z.array(adminOnlinePreferencePeriodSchema).optional(),
        siteId: z.string().min(1),
        // Пока online-app не обновлён, статистики инструментов в ответе нет — панель покажет прочерки.
        usage: z.array(adminOnlineFeatureUsageSchema).optional(),
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
