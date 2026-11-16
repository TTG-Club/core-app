import type { AdminOnlineHistoryDay } from '~admin/online/model';

import { describe, expect, it } from 'vitest';

import {
  ADMIN_ONLINE_HISTORY_METRICS,
  createHistoryMetricTile,
  getHistoryAxisLabelStep,
  getHistoryScaleMaximum,
  parseAdminOnlineHistory,
  selectHistoryDays,
} from '~admin/online/model';

const emptyDay = {
  averageOnline: null,
  guests: null,
  peakAt: null,
  peakOnline: null,
  registered: null,
  visitors: null,
};

const days: Array<AdminOnlineHistoryDay> = [
  { ...emptyDay, date: '2026-11-13' },
  {
    averageOnline: 4.25,
    date: '2026-11-14',
    guests: 80,
    peakAt: '2026-11-14T21:00:00+03:00',
    peakOnline: 12,
    registered: 20,
    visitors: 100,
  },
  {
    averageOnline: 6,
    date: '2026-11-15',
    guests: 150,
    peakAt: '2026-11-15T20:30:00+03:00',
    peakOnline: 30,
    registered: 51,
    visitors: 201,
  },
];

/**
 * Показатель из настроек панели: в тестах их порядок не важен.
 */
function getMetricSection(metric: string) {
  const section = ADMIN_ONLINE_HISTORY_METRICS.find(
    (metricSection) => metricSection.metric === metric,
  );

  if (!section) {
    throw new Error(`Нет показателя ${metric}`);
  }

  return section;
}

describe('история посещаемости', () => {
  it('пропущенные поля суток читает как null', () => {
    const history = parseAdminOnlineHistory({
      from: '2026-11-15',
      sites: [{ days: [{ date: '2026-11-15' }], siteId: '5e24' }],
      to: '2026-11-15',
      total: { days: [{ date: '2026-11-15', visitors: 3 }] },
      zone: 'Europe/Moscow',
    });

    expect(history.sites[0]?.days[0]).toEqual({
      ...emptyDay,
      date: '2026-11-15',
    });

    expect(history.total.days[0]?.visitors).toBe(3);
  });

  it('берёт хвост периода у площадки и у всех вместе', () => {
    const history = { sites: [{ days, siteId: '5e24' }], total: { days } };

    expect(
      selectHistoryDays(history, '5e24', 2).map(({ date }) => date),
    ).toEqual(['2026-11-14', '2026-11-15']);

    expect(selectHistoryDays(history, 'all', 7)).toHaveLength(3);
    expect(selectHistoryDays(history, 'vttg', 7)).toEqual([]);
  });

  it('среднее считает только по суткам с данными', () => {
    const tile = createHistoryMetricTile(getMetricSection('visitors'), days);

    expect(tile.value).toBe('151');
  });

  it('у пика показывает лучшие сутки', () => {
    const tile = createHistoryMetricTile(getMetricSection('peakOnline'), days);

    expect(tile.value).toBe('30');
    expect(tile.caption).toContain('15');
  });

  it('без данных ставит прочерк', () => {
    const tile = createHistoryMetricTile(getMetricSection('visitors'), [
      { ...emptyDay, date: '2026-11-13' },
    ]);

    expect(tile.value).toBe('—');
    expect(tile.caption).toBe('');
  });

  it('округляет верх шкалы до круглого числа', () => {
    expect(getHistoryScaleMaximum(4000, 'visitors')).toBe(4500);
    expect(getHistoryScaleMaximum(283, 'peakOnline')).toBe(300);
    expect(getHistoryScaleMaximum(2, 'visitors')).toBe(3);
    expect(getHistoryScaleMaximum(0, 'visitors')).toBe(3);
    expect(getHistoryScaleMaximum(0.4, 'averageOnline')).toBeCloseTo(0.45);
  });

  it('прореживает подписи дат по ширине графика', () => {
    expect(getHistoryAxisLabelStep(30, 1000)).toBe(5);
    expect(getHistoryAxisLabelStep(30, 290)).toBe(8);
    expect(getHistoryAxisLabelStep(7, 1000)).toBe(1);
  });
});
