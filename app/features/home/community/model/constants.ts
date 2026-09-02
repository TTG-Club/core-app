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

/**
 * Размер рейтинга: бэк отдаёт топ-10, недостающие до этого числа позиции
 * дорисовываются строками-заглушками (актуально в начале месяца)
 */
export const COMMUNITY_TOP_SIZE = 10;

/**
 * Подписи свободных позиций рейтинга в духе D&D. Раздаются по порядку
 * среди пустых строк (первая пустая — первая фраза), по кругу, если пустых
 * больше, чем фраз.
 */
export const COMMUNITY_EMPTY_SLOT_TEXTS: readonly string[] = [
  'Ждёт своего героя',
  'Здесь водятся драконы',
  'Проверка Восприятия провалена',
  'Ячейка заклинания свободна',
  'Кости ещё не брошены',
  'Квест пока никто не взял',
  'Ловушка не обезврежена',
  'Логово ещё не зачищено',
  'Стул у очага пустует',
  'Сокровище ждёт искателя',
];

/** Шаг задержки анимации появления строк рейтинга (мс) */
export const COMMUNITY_ROW_STAGGER_MS = 80;
