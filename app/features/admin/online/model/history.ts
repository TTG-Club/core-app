import type { TabsItem } from '@nuxt/ui';

import type {
  AdminOnlineHistoryDay,
  AdminOnlineHistoryMetric,
  AdminOnlineHistoryMetricSection,
  AdminOnlineHistoryMetricTile,
  AdminOnlineHistoryPoint,
  AdminOnlineHistoryResponse,
} from './types';

import { ADMIN_DASHBOARD_NUMBER_FORMAT } from '~admin/dashboard/model';

import {
  ADMIN_ONLINE_HISTORY_ALL_SITES,
  ADMIN_ONLINE_HISTORY_ALL_SITES_LABEL,
  ADMIN_ONLINE_HISTORY_AVERAGE_CAPTION,
  ADMIN_ONLINE_HISTORY_AVERAGE_FORMAT,
  ADMIN_ONLINE_HISTORY_AXIS_DATE_FORMAT,
  ADMIN_ONLINE_HISTORY_CHART_AXIS_LABEL_MIN_WIDTH,
  ADMIN_ONLINE_HISTORY_CHART_DECIMAL_BASE,
  ADMIN_ONLINE_HISTORY_CHART_GRID_LINES,
  ADMIN_ONLINE_HISTORY_CHART_MAX_AXIS_LABELS,
  ADMIN_ONLINE_HISTORY_CHART_NICE_STEPS,
  ADMIN_ONLINE_HISTORY_MAXIMUM_CAPTION_PREFIX,
  ADMIN_ONLINE_HISTORY_PEAK_TIME_FORMAT,
  ADMIN_ONLINE_HISTORY_SITE_LABELS,
  ADMIN_ONLINE_HISTORY_TOOLTIP_DATE_FORMAT,
  ADMIN_ONLINE_STATS_EMPTY_VALUE,
} from './constants';

/**
 * Превращает дату суток `YYYY-MM-DD` в момент — полночь UTC. Выводить её надо тоже
 * в UTC, тогда сутки не съедут в соседние ни в каком поясе.
 */
function parseHistoryDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/**
 * Подпись даты под осью графика: «16 нояб.».
 */
export function formatHistoryAxisDate(date: string): string {
  return ADMIN_ONLINE_HISTORY_AXIS_DATE_FORMAT.format(parseHistoryDate(date));
}

/**
 * Дата в подсказке над точкой графика: «пн, 16 ноября».
 */
export function formatHistoryTooltipDate(date: string): string {
  return ADMIN_ONLINE_HISTORY_TOOLTIP_DATE_FORMAT.format(
    parseHistoryDate(date),
  );
}

/**
 * Время пика онлайна по Москве. Нет времени или оно не разбирается — `null`:
 * строку в подсказке тогда просто не показываем.
 */
export function formatHistoryPeakTime(peakAt: string | null): string | null {
  if (!peakAt) {
    return null;
  }

  const peakMoment = new Date(peakAt);

  return Number.isNaN(peakMoment.getTime())
    ? null
    : ADMIN_ONLINE_HISTORY_PEAK_TIME_FORMAT.format(peakMoment);
}

/**
 * Приводит значение показателя к строке: средний онлайн с одним знаком после
 * запятой, остальное — целыми людьми. Без данных — прочерк.
 */
export function formatHistoryValue(
  value: number | null,
  metric: AdminOnlineHistoryMetric,
): string {
  if (value === null) {
    return ADMIN_ONLINE_STATS_EMPTY_VALUE;
  }

  return metric === 'averageOnline'
    ? ADMIN_ONLINE_HISTORY_AVERAGE_FORMAT.format(value)
    : ADMIN_DASHBOARD_NUMBER_FORMAT.format(value);
}

/**
 * Сутки выбранной площадки за последние `period` дней. Площадки нет в ответе — пустой
 * список: панель покажет, что данных нет.
 */
export function selectHistoryDays(
  history: AdminOnlineHistoryResponse,
  siteKey: string,
  period: number,
): AdminOnlineHistoryDay[] {
  const days =
    siteKey === ADMIN_ONLINE_HISTORY_ALL_SITES
      ? history.total.days
      : (history.sites.find(({ siteId }) => siteId === siteKey)?.days ?? []);

  return days.slice(-period);
}

/**
 * Точки графика для показателя: по одной на сутки, `null` — разрыв линии.
 */
export function createHistoryPoints(
  days: ReadonlyArray<AdminOnlineHistoryDay>,
  metric: AdminOnlineHistoryMetric,
): AdminOnlineHistoryPoint[] {
  return days.map((day) => ({ day, value: day[metric] }));
}

/**
 * Есть ли у точек хоть одно значение. Без них график рисовать не из чего.
 */
export function hasHistoryValues(
  points: ReadonlyArray<AdminOnlineHistoryPoint>,
): boolean {
  return points.some(({ value }) => value !== null);
}

/**
 * Плитка-переключатель показателя: среднее за сутки периода или лучшие сутки с датой.
 * Сутки без данных в среднее не идут — иначе неполная история тянула бы его к нулю.
 */
export function createHistoryMetricTile(
  section: AdminOnlineHistoryMetricSection,
  days: ReadonlyArray<AdminOnlineHistoryDay>,
): AdminOnlineHistoryMetricTile {
  const knownDays = days.filter((day) => day[section.metric] !== null);

  if (!knownDays.length) {
    return {
      ...section,
      caption: '',
      value: ADMIN_ONLINE_STATS_EMPTY_VALUE,
    };
  }

  if (section.summary === 'maximum') {
    const bestDay = knownDays.reduce((best, day) =>
      (day[section.metric] ?? 0) > (best[section.metric] ?? 0) ? day : best,
    );

    return {
      ...section,
      caption: `${ADMIN_ONLINE_HISTORY_MAXIMUM_CAPTION_PREFIX} ${formatHistoryAxisDate(bestDay.date)}`,
      value: formatHistoryValue(bestDay[section.metric], section.metric),
    };
  }

  const total = knownDays.reduce(
    (sum, day) => sum + (day[section.metric] ?? 0),
    0,
  );

  const average = total / knownDays.length;

  return {
    ...section,
    caption: ADMIN_ONLINE_HISTORY_AVERAGE_CAPTION,
    value: formatHistoryValue(
      section.metric === 'averageOnline' ? average : Math.round(average),
      section.metric,
    ),
  };
}

/**
 * Верх шкалы графика: ближайшее сверху «круглое» число, которое делится на линии
 * сетки без дробей вроде 13,3. У целых показателей шаг сетки не меньше единицы.
 */
export function getHistoryScaleMaximum(
  maximumValue: number,
  metric: AdminOnlineHistoryMetric,
): number {
  const rawStep =
    Math.max(maximumValue, 0) / ADMIN_ONLINE_HISTORY_CHART_GRID_LINES;

  const minimumStep = metric === 'averageOnline' ? 0 : 1;

  if (rawStep <= 0) {
    return ADMIN_ONLINE_HISTORY_CHART_GRID_LINES;
  }

  const magnitude =
    ADMIN_ONLINE_HISTORY_CHART_DECIMAL_BASE ** Math.floor(Math.log10(rawStep));

  const niceStep =
    ADMIN_ONLINE_HISTORY_CHART_NICE_STEPS.map((step) => step * magnitude).find(
      (step) => step >= rawStep,
    ) ?? rawStep;

  return (
    Math.max(niceStep, minimumStep) * ADMIN_ONLINE_HISTORY_CHART_GRID_LINES
  );
}

/**
 * Через сколько суток подписывать даты под осью: подписей не больше предела, и на
 * каждую приходится не меньше заданной ширины — на телефоне они иначе налезают.
 */
export function getHistoryAxisLabelStep(
  dayCount: number,
  plotWidth: number,
): number {
  const labelLimit = Math.max(
    1,
    Math.min(
      ADMIN_ONLINE_HISTORY_CHART_MAX_AXIS_LABELS,
      Math.floor(plotWidth / ADMIN_ONLINE_HISTORY_CHART_AXIS_LABEL_MIN_WIDTH),
    ),
  );

  return Math.max(1, Math.ceil(dayCount / labelLimit));
}

/**
 * Крайние подписи дат прижимаются внутрь графика, иначе их обрезает край.
 */
export function getHistoryAxisLabelAnchor(
  index: number,
  lastIndex: number,
): 'end' | 'middle' | 'start' {
  if (lastIndex > 0 && index === lastIndex) {
    return 'end';
  }

  return index === 0 && lastIndex > 0 ? 'start' : 'middle';
}

/**
 * Вкладки площадок: сначала «Все», затем площадки из ответа в его порядке.
 */
export function createHistorySiteTabs(
  history: AdminOnlineHistoryResponse | null,
): TabsItem[] {
  const siteTabs = (history?.sites ?? []).map(({ siteId }) => ({
    label: ADMIN_ONLINE_HISTORY_SITE_LABELS[siteId] ?? siteId,
    value: siteId,
  }));

  return [
    {
      label: ADMIN_ONLINE_HISTORY_ALL_SITES_LABEL,
      value: ADMIN_ONLINE_HISTORY_ALL_SITES,
    },
    ...siteTabs,
  ];
}
