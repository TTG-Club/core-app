import { describe, expect, it } from 'vitest';

import { isFutureSessionStart } from '~find-game/model';

describe('проверка начала сессии', () => {
  const currentTime = Date.parse('2026-09-09T12:00:00Z');

  it.each([
    null,
    '',
    'invalid',
    '2026-09-08T23:00:00Z',
    '2026-09-09T11:59:00Z',
    '2026-09-09T12:00:00Z',
  ])(
    'отклоняет отсутствующее, некорректное или прошедшее начало: %s',
    (startsAt) => {
      expect(isFutureSessionStart(startsAt, currentTime)).toBe(false);
    },
  );

  it('разрешает будущее время сегодня', () => {
    expect(isFutureSessionStart('2026-09-09T12:01:00Z', currentTime)).toBe(
      true,
    );
  });

  it('сравнивает моменты с учётом смещения часового пояса', () => {
    expect(isFutureSessionStart('2026-09-09T14:59:00+03:00', currentTime)).toBe(
      false,
    );

    expect(isFutureSessionStart('2026-09-09T15:01:00+03:00', currentTime)).toBe(
      true,
    );
  });

  it('отклоняет начало, которое прошло за время заполнения формы', () => {
    const startsAt = '2026-09-09T12:01:00Z';

    expect(isFutureSessionStart(startsAt, currentTime)).toBe(true);
    expect(isFutureSessionStart(startsAt, Date.parse(startsAt))).toBe(false);
  });
});
