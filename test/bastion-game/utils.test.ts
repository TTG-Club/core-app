import type { PlayerBastion } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import { createMemberDrafts, toMemberRequests } from '~bastion-game/model';

/**
 * Бастион с одним участником; остальные поля на форму доступа не влияют.
 *
 * @returns бастион.
 */
function createBastion(): PlayerBastion {
  return {
    id: 'bastion',
    gameId: 'game',
    name: 'Вороний утёс',
    status: 'SETUP',
    turn: 0,
    treasuryGp: 0,
    version: 2,
    canManage: true,
    canEdit: true,
    members: [
      {
        id: 'member-1',
        userId: 'player-1',
        characterName: 'Дриззт До’Урден',
        characterLevel: 9,
        characterSheetId: null,
        specialFacilityLimit: 4,
        canEditFacilities: true,
        basicComplete: false,
        facilities: [],
      },
    ],
  };
}

describe('форма доступа к бастиону', () => {
  const players = [
    { userId: 'player-1', characterName: 'Дриззт' },
    { userId: 'player-2', characterName: null },
  ];

  it('у игрока с доступом — его персонаж, у остальных — имя из заявки и 5 уровень', () => {
    const drafts = createMemberDrafts(players, createBastion());

    expect(drafts).toEqual([
      {
        userId: 'player-1',
        selected: true,
        characterName: 'Дриззт До’Урден',
        characterLevel: 9,
      },
      {
        userId: 'player-2',
        selected: false,
        characterName: '',
        characterLevel: 5,
      },
    ]);
  });

  it('в запрос уходят только отмеченные игроки, с обрезанным именем', () => {
    const drafts = createMemberDrafts(players).map((draft) => ({
      ...draft,
      selected: draft.userId === 'player-2',
      characterName: draft.userId === 'player-2' ? '  Эльминстер ' : '',
    }));

    expect(toMemberRequests(drafts)).toEqual([
      { userId: 'player-2', characterName: 'Эльминстер', characterLevel: 5 },
    ]);
  });
});
