import { describe, expect, it } from 'vitest';

import { durationBetween, findNearestMoment } from '~find-game/model';

const HOUR = 60 * 60 * 1000;

describe('findNearestMoment', () => {
  it('возвращает null для пустого списка', () => {
    expect(findNearestMoment([], 0)).toBeNull();
  });

  it('берёт ближайший предстоящий момент', () => {
    const now = 100 * HOUR;

    expect(
      findNearestMoment([now + 3 * HOUR, now + 10 * HOUR, now + HOUR], now),
    ).toBe(now + HOUR);
  });

  it('предпочитает будущее прошлому даже когда прошлое ближе', () => {
    const now = 100 * HOUR;

    expect(findNearestMoment([now - HOUR, now + 5 * HOUR], now)).toBe(
      now + 5 * HOUR,
    );
  });

  it('берёт момент точно в точке отсчёта', () => {
    const now = 100 * HOUR;

    expect(findNearestMoment([now - HOUR, now, now + HOUR], now)).toBe(now);
  });

  it('откатывается к прошлому, когда впереди ничего нет', () => {
    const now = 100 * HOUR;

    expect(findNearestMoment([now - 10 * HOUR, now - HOUR], now)).toBe(
      now - HOUR,
    );
  });
});

describe('durationBetween', () => {
  it('считает длительность внутри одних суток', () => {
    expect(durationBetween(19 * 60, 23 * 60)).toBe(240);
  });

  it('переносит конец за полночь, а не считает время отрицательным', () => {
    expect(durationBetween(22 * 60, 1 * 60)).toBe(180);
  });

  it('не признаёт длительностью совпавшие границы', () => {
    expect(durationBetween(19 * 60, 19 * 60)).toBeNull();
  });
});
