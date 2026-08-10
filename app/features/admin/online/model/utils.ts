import {
  ADMIN_ONLINE_STATS_EMPTY_VALUE,
  ADMIN_ONLINE_STATS_VTTG_SITE_ID,
  ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
} from './constants';

/**
 * Относится ли площадка к VTTG. Аудиторий у приложения две — запущенные приложения и
 * игроки за чужими столами, — но карточка у них одна: в отрыве друг от друга эти числа
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
