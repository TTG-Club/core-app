import type {
  AdminOnlinePreferenceCounts,
  AdminOnlinePreferenceRow,
  AdminOnlinePreferenceSection,
  AdminOnlinePreferenceSummary,
  AdminOnlineSiteStats,
} from './types';

import {
  ADMIN_ONLINE_PREFERENCES_PERCENT_SIGN,
  ADMIN_ONLINE_PREFERENCES_PERIOD_LABELS,
  ADMIN_ONLINE_PREFERENCES_SHARE_MAX,
  ADMIN_ONLINE_PREFERENCES_SHARE_SEPARATOR,
  ADMIN_ONLINE_STATS_EMPTY_VALUE,
  ADMIN_ONLINE_STATS_VTTG_SITE_ID,
  ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
} from './constants';

/**
 * Относится ли площадка к VTTG. Аудиторий у приложения две — запущенные приложения и
 * игроки за чужими столами, — но плитка у них одна: в отрыве друг от друга эти числа
 * не значат ничего, поэтому в общей сетке площадок обе пропускаются.
 */
export function isVttgSite(siteId: string): boolean {
  return (
    siteId === ADMIN_ONLINE_STATS_VTTG_SITE_ID
    || siteId === ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID
  );
}

/**
 * Приводит счётчик к строке: без данных ставим прочерк, ноль остаётся нулём.
 */
export function formatCounter(value: number | undefined): string {
  return typeof value === 'number'
    ? String(value)
    : ADMIN_ONLINE_STATS_EMPTY_VALUE;
}

/**
 * Считает, сколько осталось за вычетом доли. Нет одного из чисел — нет и разности:
 * прочерк честнее выдуманного нуля.
 */
export function formatRemainder(
  total: number | undefined,
  part: number | undefined,
): string {
  return typeof total === 'number' && typeof part === 'number'
    ? String(total - part)
    : ADMIN_ONLINE_STATS_EMPTY_VALUE;
}

/**
 * Складывает две аудитории в общее число людей. Одной из них нет — итога тоже нет.
 */
export function formatSum(
  first: number | undefined,
  second: number | undefined,
): string {
  return typeof first === 'number' && typeof second === 'number'
    ? String(first + second)
    : ADMIN_ONLINE_STATS_EMPTY_VALUE;
}

/**
 * Собирает периоды, за которые площадки прислали срезы настроек, — по возрастанию и
 * без повторов.
 */
export function collectPreferencePeriods(
  sites: ReadonlyArray<AdminOnlineSiteStats>,
): Array<number> {
  const periods = new Set(
    sites.flatMap((site) => (site.preferences ?? []).map(({ days }) => days)),
  );

  return [...periods].sort((first, second) => first - second);
}

/**
 * Складывает срезы настроек всех площадок за один период. Настройки шлёт обычно одна
 * площадка, но если их станет несколько, числа просуммируются.
 */
export function sumPreferencePeriod(
  sites: ReadonlyArray<AdminOnlineSiteStats>,
  days: number,
): AdminOnlinePreferenceCounts {
  const periods = sites.flatMap((site) =>
    (site.preferences ?? []).filter((period) => period.days === days),
  );

  return periods.reduce<AdminOnlinePreferenceCounts>(
    (result, period) =>
      Object.entries(period.preferences).reduce<AdminOnlinePreferenceCounts>(
        (merged, [name, counts]) => ({
          ...merged,
          [name]: Object.entries(counts).reduce<Record<string, number>>(
            (values, [value, count]) => ({
              ...values,
              [value]: (values[value] ?? 0) + count,
            }),
            merged[name] ?? {},
          ),
        }),
        result,
      ),
    {},
  );
}

/**
 * Подписывает период: знакомые периоды — словами, остальные — числом дней.
 */
export function formatPreferencePeriod(days: number): string {
  return ADMIN_ONLINE_PREFERENCES_PERIOD_LABELS[days] ?? String(days);
}

/**
 * Собирает сводку настройки: сначала известные варианты в порядке панели настроек
 * (даже с нулём — так видно, что вариантом не пользуются), затем незнакомые значения
 * из ответа; итог — сумма всех вариантов. Без данных вместо чисел прочерки.
 */
export function createPreferenceSummary(
  section: AdminOnlinePreferenceSection,
  counts: Readonly<Record<string, number>> | null,
): AdminOnlinePreferenceSummary {
  const knownValues = new Set(section.options.map(({ value }) => value));

  const unknownOptions = Object.keys(counts ?? {})
    .filter((preferenceValue) => !knownValues.has(preferenceValue))
    .map((preferenceValue) => ({
      label: preferenceValue,
      value: preferenceValue,
    }));

  const preferenceOptions = [...section.options, ...unknownOptions];

  const total = preferenceOptions.reduce(
    (sum, preferenceOption) => sum + (counts?.[preferenceOption.value] ?? 0),
    0,
  );

  const optionRows = preferenceOptions.map(
    (preferenceOption): AdminOnlinePreferenceRow => {
      const count = counts?.[preferenceOption.value] ?? 0;

      const share = total
        ? Math.round((count / total) * ADMIN_ONLINE_PREFERENCES_SHARE_MAX)
        : 0;

      return {
        label: preferenceOption.label,
        share,
        value: counts
          ? `${count}${ADMIN_ONLINE_PREFERENCES_SHARE_SEPARATOR}${share}${ADMIN_ONLINE_PREFERENCES_PERCENT_SIGN}`
          : ADMIN_ONLINE_STATS_EMPTY_VALUE,
      };
    },
  );

  return {
    name: section.name,
    rows: optionRows,
    title: section.title,
    total: counts ? String(total) : ADMIN_ONLINE_STATS_EMPTY_VALUE,
  };
}
