import { describe, expect, it } from 'vitest';

import {
  applyHitPointsDelta,
  mergeTemporaryHitPoints,
} from '~initiative/model';

describe('applyHitPointsDelta', () => {
  it('урон сначала снимает временные хиты', () => {
    expect(applyHitPointsDelta({ current: 20, temporary: 5 }, -3, 30)).toEqual({
      current: 20,
      temporary: 2,
    });
  });

  it('остаток урона после временных хитов снимает текущие', () => {
    expect(applyHitPointsDelta({ current: 20, temporary: 5 }, -8, 30)).toEqual({
      current: 17,
      temporary: 0,
    });
  });

  it('урон не опускает хиты ниже нуля', () => {
    expect(applyHitPointsDelta({ current: 4, temporary: 2 }, -50, 30)).toEqual({
      current: 0,
      temporary: 0,
    });
  });

  it('лечение не трогает временные хиты и упирается в максимум', () => {
    expect(applyHitPointsDelta({ current: 28, temporary: 5 }, 5, 30)).toEqual({
      current: 30,
      temporary: 5,
    });
  });

  it('без известного максимума лечение не ограничено', () => {
    expect(applyHitPointsDelta({ current: 10, temporary: 0 }, 5, 0)).toEqual({
      current: 15,
      temporary: 0,
    });
  });
});

describe('mergeTemporaryHitPoints', () => {
  it('большее значение заменяет прежнее', () => {
    expect(mergeTemporaryHitPoints(5, 8)).toBe(8);
  });

  it('меньшее значение прежнее не меняет', () => {
    expect(mergeTemporaryHitPoints(8, 5)).toBe(8);
  });

  it('без прежних временных хитов ставится новое значение', () => {
    expect(mergeTemporaryHitPoints(0, 6)).toBe(6);
  });
});
