import type { PlayerBastion } from '~bastion-game/model';

import { FetchError } from 'ofetch';
import { describe, expect, it } from 'vitest';

import {
  createMemberDrafts,
  getBastionErrorMessage,
  toMemberRequests,
} from '~bastion-game/model';

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

describe('текст ошибки бастиона', () => {
  /**
   * Ошибка запроса с ответом core-api.
   *
   * @param statusCode код ответа.
   * @param message текст из тела ответа.
   * @returns ошибка запроса.
   */
  function fetchError(statusCode: number, message: string): FetchError {
    const error = new FetchError(message);

    error.statusCode = statusCode;
    error.data = { message };

    return error;
  }

  it('показывает текст 4xx и 503, прячет прочие 5xx', () => {
    expect(
      getBastionErrorMessage(fetchError(404, 'Игра не найдена'), 'Сбой'),
    ).toBe('Игра не найдена');

    expect(
      getBastionErrorMessage(
        fetchError(503, 'Каталог игр сейчас недоступен'),
        'Сбой',
      ),
    ).toBe('Каталог игр сейчас недоступен');

    expect(
      getBastionErrorMessage(fetchError(500, 'NullPointerException'), 'Сбой'),
    ).toBe('Сбой');
  });

  it('достаёт ответ сервера из ошибки useAsyncData', () => {
    const wrapped = new Error('Сбой', {
      cause: fetchError(403, 'Бастионы игры видят только её участники'),
    });

    expect(getBastionErrorMessage(wrapped, 'Сбой')).toBe(
      'Бастионы игры видят только её участники',
    );
  });
});
