import { z } from 'zod';

import { BUG_REPORT_EXTERNAL_API_BASE_URL } from '#server/utils/bugReportApi';
import { resolveDisplayNamesByLogins } from '#server/utils/displayName';

const fixerSchema = z.object({
  login: z.string(),
  fixed: z.number(),
});

const bugStatsSchema = z.object({
  totalCount: z.number(),
  fixedCount: z.number(),
  topFixers: z.array(fixerSchema),
  fixedCountThisMonth: z.number(),
  topFixersThisMonth: z.array(fixerSchema),
});

type Fixer = z.infer<typeof fixerSchema>;

/**
 * Заменяет логины на отображаемые имена; для логинов без заданного имени
 * оставляет логин (фолбэк «пусто → логин»). Логины на клиент при этом не уходят.
 */
function toNamedFixers(
  fixers: Fixer[],
  nameByLogin: Map<string, string>,
): Array<{ name: string; fixed: number }> {
  return fixers.map((fixer) => ({
    name: nameByLogin.get(fixer.login.toLowerCase()) ?? fixer.login,
    fixed: fixer.fixed,
  }));
}

/**
 * Общая статистика по баг-репортам: всего, решённых и топ-10 охотников.
 * Логины охотников резолвятся в отображаемые имена (core-api), чтобы на главной
 * показывалось имя, а не логин. Доступен без авторизации.
 */
export default defineEventHandler(async () => {
  let stats: z.infer<typeof bugStatsSchema>;

  try {
    stats = bugStatsSchema.parse(
      await $fetch(`${BUG_REPORT_EXTERNAL_API_BASE_URL}/stats`, {
        method: 'GET',
      }),
    );
  } catch (error: unknown) {
    return handleFetchError(
      '[bug-report]',
      'Ошибка получения статистики баг-репортов',
      error,
    );
  }

  const nameByLogin = await resolveDisplayNamesByLogins(
    [...stats.topFixers, ...stats.topFixersThisMonth].map(
      (fixer) => fixer.login,
    ),
  );

  return {
    totalCount: stats.totalCount,
    fixedCount: stats.fixedCount,
    fixedCountThisMonth: stats.fixedCountThisMonth,
    topFixers: toNamedFixers(stats.topFixers, nameByLogin),
    topFixersThisMonth: toNamedFixers(stats.topFixersThisMonth, nameByLogin),
  };
});
