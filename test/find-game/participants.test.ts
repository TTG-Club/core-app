import { describe, expect, it } from 'vitest';

import { gameParticipantsSchema } from '~find-game/model';

describe('карточки участников', () => {
  it('принимает минимальные сведения об участнике и удаляет приватные поля', () => {
    const participants = gameParticipantsSchema.parse([
      {
        playerId: '123e4567-e89b-42d3-a456-426614174000',
        characterName: 'Следопыт',
        characterSheetUrl: 'https://example.com/private',
        rejectionReason: 'Приватная причина',
      },
    ]);

    expect(participants).toEqual([
      {
        playerId: '123e4567-e89b-42d3-a456-426614174000',
        characterName: 'Следопыт',
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
});
