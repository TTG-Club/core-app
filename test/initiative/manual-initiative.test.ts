import { describe, expect, it } from 'vitest';

import {
  getManualInitiativeRange,
  getManualInitiativeValue,
  getRollFromManualInitiative,
  isManualInitiativeMode,
} from '~initiative/model';

describe('getManualInitiativeRange', () => {
  it('в режиме броска — грани к20', () => {
    expect(getManualInitiativeRange('roll', 3)).toEqual({ min: 1, max: 20 });
  });

  it('в режиме итога грани сдвинуты на бонус', () => {
    expect(getManualInitiativeRange('total', 3)).toEqual({ min: 4, max: 23 });
    expect(getManualInitiativeRange('total', -2)).toEqual({ min: -1, max: 18 });
  });
});

describe('getManualInitiativeValue', () => {
  it('в режиме итога прибавляет бонус к броску', () => {
    expect(getManualInitiativeValue('total', 12, 4)).toBe(16);
  });

  it('в режиме броска оставляет бросок', () => {
    expect(getManualInitiativeValue('roll', 12, 4)).toBe(12);
  });
});

describe('getRollFromManualInitiative', () => {
  it('переводит итог в бросок: итог минус бонус', () => {
    expect(getRollFromManualInitiative('total', 17, 5)).toBe(12);
    expect(getRollFromManualInitiative('total', 10, -2)).toBe(12);
  });

  it('прижимает бросок из итога к граням к20', () => {
    expect(getRollFromManualInitiative('total', 30, 5)).toBe(20);
    expect(getRollFromManualInitiative('total', 2, 5)).toBe(1);
  });

  it('в режиме броска только прижимает значение к граням к20', () => {
    expect(getRollFromManualInitiative('roll', 15, 5)).toBe(15);
    expect(getRollFromManualInitiative('roll', 25, 5)).toBe(20);
    expect(getRollFromManualInitiative('roll', 0, 5)).toBe(1);
  });

  it('обратна getManualInitiativeValue в пределах к20', () => {
    const total = getManualInitiativeValue('total', 7, 3);

    expect(getRollFromManualInitiative('total', total, 3)).toBe(7);
  });
});

describe('isManualInitiativeMode', () => {
  it('узнаёт оба режима', () => {
    expect(isManualInitiativeMode('total')).toBe(true);
    expect(isManualInitiativeMode('roll')).toBe(true);
  });

  it('отвергает прочие значения из хранилища', () => {
    expect(isManualInitiativeMode('d20')).toBe(false);
    expect(isManualInitiativeMode('')).toBe(false);
    expect(isManualInitiativeMode(null)).toBe(false);
  });
});
