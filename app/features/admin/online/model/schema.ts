import type {
  AdminOnlineHistoryResponse,
  AdminOnlineStatsResponse,
} from './types';

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

/**
 * Поле суток, которого может не быть: день без данных. Пропущенное поле и `null`
 * значат одно и то же — сводим к `null`, чтобы дальше проверять одно.
 */
function nullableHistoryField<Schema extends z.ZodType>(
  schema: Schema,
): z.ZodType<z.output<Schema> | null, z.input<Schema> | null | undefined> {
  return schema.nullish().transform((fieldValue) => fieldValue ?? null);
}

const adminOnlineHistoryDaySchema = z.object({
  averageOnline: nullableHistoryField(z.number().nonnegative()),
  date: z.iso.date(),
  guests: nullableHistoryField(z.number().int().nonnegative()),
  peakAt: nullableHistoryField(z.string().min(1)),
  peakOnline: nullableHistoryField(z.number().int().nonnegative()),
  registered: nullableHistoryField(z.number().int().nonnegative()),
  visitors: nullableHistoryField(z.number().int().nonnegative()),
});

const adminOnlineHistoryResponseSchema: z.ZodType<AdminOnlineHistoryResponse> =
  z.object({
    sites: z.array(
      z.object({
        days: z.array(adminOnlineHistoryDaySchema),
        siteId: z.string().min(1),
      }),
    ),
    total: z.object({
      days: z.array(adminOnlineHistoryDaySchema),
    }),
  });

/**
 * Проверяет ответ online-app с посещаемостью по суткам.
 */
export function parseAdminOnlineHistory(
  payload: unknown,
): AdminOnlineHistoryResponse {
  return adminOnlineHistoryResponseSchema.parse(payload);
}
