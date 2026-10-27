import { describe, expect, it } from 'vitest';

import { parseAdminGameStatistics } from '~admin/games/model';

describe('статистика игр в админке', () => {
  it.each([
    { total: 0, completed: 0 },
    { total: 1234, completed: 321 },
    { total: 5, completed: 5 },
  ])('принимает корректные счётчики: %j', (statistics) => {
    expect(parseAdminGameStatistics(statistics)).toEqual(statistics);
  });

  it.each([
    null,
    {},
    { total: 5 },
    { total: '5', completed: 1 },
    { total: 5, completed: -1 },
    { total: -1, completed: 0 },
    { total: 5.5, completed: 1 },
    { total: 5, completed: 1.5 },
    { total: 1, completed: 2 },
    { total: Number.POSITIVE_INFINITY, completed: 0 },
  ])('не заменяет ошибочный ответ нулевыми значениями: %j', (payload) => {
    expect(() => parseAdminGameStatistics(payload)).toThrow();
  });
});
