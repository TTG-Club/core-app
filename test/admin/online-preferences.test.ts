import type { AdminOnlineSiteStats } from '~admin/online/model';

import { describe, expect, it } from 'vitest';

import {
  collectPreferencePeriods,
  createPreferenceRows,
  sumPreferencePeriod,
} from '~admin/online/model';

const sites: Array<AdminOnlineSiteStats> = [
  {
    guests: 1,
    preferences: [
      { days: 7, preferences: { theme: { dark: 6, light: 2 } } },
      { days: 1, preferences: { theme: { dark: 3 }, width: { wide: 3 } } },
    ],
    registered: 0,
    siteId: '5e24',
    total: 1,
  },
  {
    guests: 0,
    preferences: [{ days: 1, preferences: { theme: { dark: 1, light: 1 } } }],
    registered: 0,
    siteId: '5e14',
    total: 0,
  },
  { guests: 0, registered: 0, siteId: 'vttg', total: 0 },
];

describe('collectPreferencePeriods', () => {
  it('собирает периоды всех площадок по возрастанию без повторов', () => {
    expect(collectPreferencePeriods(sites)).toEqual([1, 7]);
  });
});

describe('sumPreferencePeriod', () => {
  it('складывает значения площадок за один период', () => {
    expect(sumPreferencePeriod(sites, 1)).toEqual({
      theme: { dark: 4, light: 1 },
      width: { wide: 3 },
    });
  });
});

describe('createPreferenceRows', () => {
  const section = {
    name: 'theme',
    options: [
      { icon: 'tabler:sun', label: 'Светлая', value: 'light' },
      { icon: 'tabler:moon', label: 'Темная', value: 'dark' },
    ],
    title: 'Тема',
  };

  it('держит известные варианты с нулём и добавляет незнакомые в конец', () => {
    const rows = createPreferenceRows(section, { dark: 3, old: 1 });

    expect(
      rows.map(({ value, count, share }) => [value, count, share]),
    ).toEqual([
      ['light', 0, '0%'],
      ['dark', 3, '75%'],
      ['old', 1, '25%'],
    ]);
  });

  it('без данных даёт нулевые доли', () => {
    expect(
      createPreferenceRows(section, {}).map(({ percent }) => percent),
    ).toEqual([0, 0]);
  });
});
