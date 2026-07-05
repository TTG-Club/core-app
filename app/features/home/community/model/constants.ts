/**
 * Ключ кеширования для useAsyncData статистики баг-репортов.
 * Значение оставлено прежним для совместимости кеша после переноса блока.
 */
export const COMMUNITY_BUG_STATS_DATA_KEY = 'bug-leaderboard-stats';

/** Интервал автообновления статистики (мс) — 60 секунд */
export const COMMUNITY_REFRESH_INTERVAL_MS = 60 * 1000;

/** Цвет иконки кубка победителя */
export const COMMUNITY_TROPHY_COLOR = 'var(--color-warning-400)';

/** Подпись стата исправленных багов */
export const COMMUNITY_LABEL_FIXED = 'Исправлено';

/** Подзаголовок рейтинга охотников */
export const COMMUNITY_TOP_LABEL = 'Охотники за багами';

/** Подсказка к рейтингу охотников */
export const COMMUNITY_TOP_TOOLTIP =
  'В зачёт идут только те баги, которые мы отметили как исправленные, а не просто все ваши отправленные баги';

/** Период рейтинга охотников: за всё время / за текущий месяц */
export type CommunityRatingPeriod = 'all' | 'month';

/** Опции переключателя периода рейтинга (в порядке отображения) */
export const COMMUNITY_PERIOD_OPTIONS: Array<{
  value: CommunityRatingPeriod;
  label: string;
}> = [
  { value: 'month', label: 'За текущий месяц' },
  { value: 'all', label: 'За всё время' },
];

/** Период рейтинга по умолчанию */
export const COMMUNITY_PERIOD_DEFAULT: CommunityRatingPeriod = 'month';

/** Заглушка, когда за текущий месяц ещё нет исправленных багов */
export const COMMUNITY_EMPTY_MONTH_TEXT =
  'Пока никто не исправил багов в этом месяце';
