import { describe, expect, it } from 'vitest';

import {
  getGameCardPriceLabel,
  getNextSessionLabel,
  groupSessionsByPeriod,
  parseGame,
  parseGameSessions,
} from '~find-game/model';

const NEXT_SESSION = {
  id: 'meeting-1',
  startsAt: '2026-09-09T22:00:00Z',
  estimatedDurationMinutes: 180,
  priceAmount: 1500,
  priceCurrency: 'RUB',
};

describe('карточка ближайшей встречи', () => {
  it('читает сведения о встрече и собственном участии из API', () => {
    const game = parseGame({
      id: 'game-1',
      masterId: 'master-1',
      nextSession: NEXT_SESSION,
      myRegistrationStatus: 'PENDING',
    });

    expect(game.nextSession).toEqual(NEXT_SESSION);
    expect(game.myRegistrationStatus).toBe('PENDING');
  });

  it('старый ответ без сводки остаётся читаемым', () => {
    const game = parseGame({ id: 'game-1', masterId: 'master-1' });

    expect(game.nextSession).toBeNull();
    expect(game.myRegistrationStatus).toBeNull();
    expect(getNextSessionLabel(game.nextSession)).toBe('Время согласуется');
  });

  it('показывает цену за встречу и не называет неизвестную цену бесплатной', () => {
    const game = parseGame({
      id: 'game-1',
      masterId: 'master-1',
      costType: 'PAID',
      nextSession: NEXT_SESSION,
    });

    expect(getGameCardPriceLabel(game)).toContain('RUB / за встречу');

    expect(getGameCardPriceLabel({ ...game, nextSession: null })).toBe(
      'Стоимость уточняется',
    );

    expect(getGameCardPriceLabel({ ...game, costType: 'FREE' })).toBe(
      'Бесплатно',
    );
  });

  it('показывает переход через полночь и часовой пояс', () => {
    const label = getNextSessionLabel(NEXT_SESSION, 'UTC');

    expect(label).toContain('22:00');
    expect(label).toContain('01:00');
    expect(label).toContain('UTC');
  });

  it('не принимает повреждённую дату ближайшей встречи', () => {
    expect(() =>
      parseGame({
        id: 'game-1',
        masterId: 'master-1',
        nextSession: { ...NEXT_SESSION, startsAt: 'not-a-date' },
      }),
    ).toThrow();
  });
});

describe('список расписания', () => {
  it('сортирует и группирует встречи без изменения исходного порядка', () => {
    const starts = [
      null,
      '2026-09-20T18:00:00Z',
      '2026-09-10T18:00:00Z',
      '2026-09-09T20:00:00Z',
      '2026-09-08T18:00:00Z',
      '2026-09-09T10:00:00Z',
    ];

    const sessions = parseGameSessions(
      starts.map((startsAt, index) => ({
        id: `meeting-${index}`,
        gameId: 'game-1',
        title: 'Встреча',
        startsAt,
        status: 'SCHEDULED',
      })),
    );

    const original = sessions.map((session) => session.id);

    const groups = groupSessionsByPeriod(
      sessions,
      Date.parse('2026-09-09T00:00:00Z'),
      Date.parse('2026-09-10T00:00:00Z'),
      Date.parse('2026-09-14T00:00:00Z'),
    );

    expect(groups.map((group) => group.key)).toEqual([
      'today',
      'week',
      'later',
      'past',
      'unscheduled',
    ]);

    expect(groups[0]?.sessions.map((session) => session.id)).toEqual([
      'meeting-5',
      'meeting-3',
    ]);

    expect(sessions.map((session) => session.id)).toEqual(original);
  });
});
