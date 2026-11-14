import type {
  AdminOnlinePreferenceCounts,
  AdminOnlinePreferenceRow,
  AdminOnlinePreferenceSection,
  AdminOnlinePreferenceSummary,
  AdminOnlineSiteStats,
  AdminOnlineSiteTile,
  AdminOnlineUsagePeriod,
} from './types';

import {
  ADMIN_ONLINE_PREFERENCES_PERCENT_SIGN,
  ADMIN_ONLINE_PREFERENCES_PERIOD_LABELS,
  ADMIN_ONLINE_PREFERENCES_SHARE_MAX,
  ADMIN_ONLINE_PREFERENCES_SHARE_SEPARATOR,
  ADMIN_ONLINE_STATS_EMPTY_VALUE,
  ADMIN_ONLINE_STATS_VTTG_SITE_ID,
  ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
  ADMIN_ONLINE_USAGE_AVERAGE_HINT,
  ADMIN_ONLINE_USAGE_AVERAGE_LABEL,
  ADMIN_ONLINE_USAGE_HOURS_UNIT,
  ADMIN_ONLINE_USAGE_MINUTES_IN_HOUR,
  ADMIN_ONLINE_USAGE_MINUTES_UNIT,
  ADMIN_ONLINE_USAGE_RETURNING_HINT,
  ADMIN_ONLINE_USAGE_RETURNING_LABEL,
  ADMIN_ONLINE_USAGE_VISITORS_HINT,
  ADMIN_ONLINE_USAGE_VISITORS_LABEL,
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
 * Собирает периоды, за которые площадки прислали статистику инструмента, — по
 * возрастанию и без повторов.
 */
export function collectUsagePeriods(
  sites: ReadonlyArray<AdminOnlineSiteStats>,
  feature: string,
): Array<number> {
  const periods = new Set(
    sites.flatMap((site) =>
      (site.usage ?? [])
        .filter((featureUsage) => featureUsage.feature === feature)
        .flatMap((featureUsage) =>
          featureUsage.periods.map(({ days }) => days),
        ),
    ),
  );

  return [...periods].sort((first, second) => first - second);
}

/**
 * Находит статистику инструмента на площадке за период. Площадка её не
 * прислала — `null`: плитка покажет прочерки, а не нули.
 */
export function findUsagePeriod(
  site: AdminOnlineSiteStats,
  feature: string,
  days: number | null,
): AdminOnlineUsagePeriod | null {
  const featureUsage = site.usage?.find(
    (siteUsage) => siteUsage.feature === feature,
  );

  return featureUsage?.periods.find((period) => period.days === days) ?? null;
}

/**
 * Приводит минуты к виду «42 мин» или «2 ч 15 мин».
 */
export function formatUsageMinutes(minutes: number): string {
  const hours = Math.floor(minutes / ADMIN_ONLINE_USAGE_MINUTES_IN_HOUR);
  const restMinutes = minutes % ADMIN_ONLINE_USAGE_MINUTES_IN_HOUR;

  return hours
    ? `${hours} ${ADMIN_ONLINE_USAGE_HOURS_UNIT} ${restMinutes} ${ADMIN_ONLINE_USAGE_MINUTES_UNIT}`
    : `${restMinutes} ${ADMIN_ONLINE_USAGE_MINUTES_UNIT}`;
}

/**
 * Считает, сколько времени приходится на один засчитанный день. Засчитанных
 * дней нет — среднего тоже нет: прочерк честнее нуля минут.
 */
function formatUsageAverage(period: AdminOnlineUsagePeriod | null): string {
  return period?.activeDays
    ? formatUsageMinutes(Math.round(period.activeMinutes / period.activeDays))
    : ADMIN_ONLINE_STATS_EMPTY_VALUE;
}

/**
 * Собирает плитку площадки для панели инструмента: главное число — люди,
 * которые с ним работали, под ним — открывшие, вернувшиеся и среднее время.
 */
export function createUsageTile(
  siteId: string,
  period: AdminOnlineUsagePeriod | null,
): AdminOnlineSiteTile {
  return {
    figures: [
      {
        hint: ADMIN_ONLINE_USAGE_VISITORS_HINT,
        label: ADMIN_ONLINE_USAGE_VISITORS_LABEL,
        value: formatCounter(period?.visitors),
      },
      {
        hint: ADMIN_ONLINE_USAGE_RETURNING_HINT,
        label: ADMIN_ONLINE_USAGE_RETURNING_LABEL,
        value: formatCounter(period?.returning),
      },
      {
        hint: ADMIN_ONLINE_USAGE_AVERAGE_HINT,
        label: ADMIN_ONLINE_USAGE_AVERAGE_LABEL,
        value: formatUsageAverage(period),
      },
    ],
    siteId,
    value: formatCounter(period?.users),
  };
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
    hint: section.hint,
    name: section.name,
    rows: optionRows,
    title: section.title,
    total: counts ? String(total) : ADMIN_ONLINE_STATS_EMPTY_VALUE,
    wide: section.wide ?? false,
  };
}
