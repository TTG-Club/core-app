import { describe, expect, it } from 'vitest';

import {
  applyHitPointsDelta,
  clampHitPoints,
  DEFAULT_CHARACTER,
  parseHitPointsExpression,
} from '~character-sheet/model';

/** Максимум хитов персонажа из примера: 158. */
const MAX_HIT_POINTS = 158;

describe('applyHitPointsDelta (калькулятор хитов листа)', () => {
  it('серия ударов снимает сперва временные хиты, потом текущие', () => {
    const afterFirst = applyHitPointsDelta(
      { current: MAX_HIT_POINTS, temporary: 10 },
      -28,
      MAX_HIT_POINTS,
    );

    expect(afterFirst).toEqual({ current: 140, temporary: 0 });

    const afterSecond = applyHitPointsDelta(afterFirst, -32, MAX_HIT_POINTS);

    expect(afterSecond).toEqual({ current: 108, temporary: 0 });

    const afterCritical = applyHitPointsDelta(afterSecond, -54, MAX_HIT_POINTS);

    expect(afterCritical).toEqual({ current: 54, temporary: 0 });
  });

  it('урон не опускает хиты ниже нуля', () => {
    expect(
      applyHitPointsDelta({ current: 5, temporary: 3 }, -50, MAX_HIT_POINTS),
    ).toEqual({ current: 0, temporary: 0 });
  });

  it('лечение не трогает временные хиты и не превышает максимум', () => {
    expect(
      applyHitPointsDelta({ current: 150, temporary: 4 }, 20, MAX_HIT_POINTS),
    ).toEqual({ current: MAX_HIT_POINTS, temporary: 4 });
  });

  it('сохраняет остальные поля здоровья листа', () => {
    const health = {
      ...DEFAULT_CHARACTER.health,
      max: 30,
      current: 20,
      temporary: 5,
    };

    expect(applyHitPointsDelta(health, -8, 30)).toEqual({
      ...health,
      current: 17,
      temporary: 0,
    });
  });

  it('при неизвестном максимуме ограничивает только снизу', () => {
    expect(clampHitPoints(42, 0)).toBe(42);
    expect(clampHitPoints(-3, 0)).toBe(0);
  });
});

describe('parseHitPointsExpression (ввод калькулятора хитов)', () => {
  it('число без знака — точные хиты', () => {
    expect(parseHitPointsExpression(' 20 ')).toEqual({
      amount: 20,
      delta: null,
    });
  });

  it('минус — урон, плюс — лечение', () => {
    expect(parseHitPointsExpression('-7')).toEqual({ amount: 7, delta: -7 });
    expect(parseHitPointsExpression('+3')).toEqual({ amount: 3, delta: 3 });
  });

  it('слагаемые складываются: дописанное к текущим хитам и серия ударов', () => {
    expect(parseHitPointsExpression('5+5')).toEqual({
      amount: 10,
      delta: null,
    });

    expect(parseHitPointsExpression('-28 - 32')).toEqual({
      amount: 60,
      delta: -60,
    });

    expect(parseHitPointsExpression('+10-4')).toEqual({ amount: 6, delta: 6 });
  });

  it('невалидный ввод не разбирается', () => {
    expect(parseHitPointsExpression('')).toBeNull();
    expect(parseHitPointsExpression('7 урона')).toBeNull();
    expect(parseHitPointsExpression('--7')).toBeNull();
  });
});
