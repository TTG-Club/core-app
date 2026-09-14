import { describe, expect, it } from 'vitest';

import { gameParticipantsSchema } from '~find-game/model';

describe('карточки участников', () => {
  it('принимает минимальные сведения об участнике и удаляет приватные поля', () => {
    const participants = gameParticipantsSchema.parse([
      {
        playerId: '123e4567-e89b-42d3-a456-426614174000',
        characterName: 'Следопыт',
        nextSession: null,
        characterSheetUrl: 'https://example.com/private',
        rejectionReason: 'Приватная причина',
      },
    ]);

    expect(participants).toEqual([
      {
        playerId: '123e4567-e89b-42d3-a456-426614174000',
        characterName: 'Следопыт',
        nextSession: null,
      },
    ]);
  });

  it('отклоняет некорректные идентификаторы', () => {
    expect(
      gameParticipantsSchema.safeParse([
        { playerId: 'invalid', characterName: null },
      ]).success,
    ).toBe(false);
  });

  it.each(['UNMARKED', 'ATTENDING', 'NOT_ATTENDING'])(
    'принимает отметку %s без платёжных данных',
    (attendanceStatus) => {
      const participants = gameParticipantsSchema.parse([
        {
          playerId: '123e4567-e89b-42d3-a456-426614174000',
          characterName: null,
          nextSession: {
            id: '123e4567-e89b-42d3-a456-426614174001',
            startsAt: '2099-01-01T18:00:00Z',
            estimatedDurationMinutes: 120,
            attendanceStatus,
            paid: true,
            paidAt: '2099-01-01T17:00:00Z',
          },
        },
      ]);

      expect(participants[0]?.nextSession?.attendanceStatus).toBe(
        attendanceStatus,
      );

      expect(participants[0]?.nextSession).not.toHaveProperty('paid');
      expect(participants[0]?.nextSession).not.toHaveProperty('paidAt');
    },
  );
});
