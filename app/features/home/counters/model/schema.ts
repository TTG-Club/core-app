import type { OnlineSiteStats } from './types';

import * as z from 'zod';

const onlineSiteStatsSchema: z.ZodType<OnlineSiteStats> = z.object({
  windowMinutes: z.number().int().positive(),
  siteId: z.string().min(1),
  guests: z.number().int().nonnegative(),
  registered: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const onlineUsersTotalSchema = z.union([
  z.number().int().nonnegative(),
  z
    .object({
      total: z.number().int().nonnegative(),
    })
    .transform((onlineUsers) => onlineUsers.total),
  onlineSiteStatsSchema.transform((siteStats) => siteStats.total),
]);

/**
 * Проверяет ответ online-app со статистикой пользователей на текущем сайте.
 */
export function parseOnlineSiteStats(payload: unknown): OnlineSiteStats {
  return onlineSiteStatsSchema.parse(payload);
}

/**
 * Проверяет ответ online-app со счетчиком пользователей из heartbeat.
 */
export function parseOnlineUsersTotal(payload: unknown): number {
  return onlineUsersTotalSchema.parse(payload);
}
