import type { TrackerDetailed, TrackerParticipant } from '~initiative/model';

import { describe, expect, it } from 'vitest';

import {
  parseFightStateSafe,
  toFightStateDraft,
  toReelParticipants,
} from '~nexus/model';

/** Участник боя с разумными значениями по умолчанию. */
function participant(
  overrides: Partial<TrackerParticipant> = {},
): TrackerParticipant {
  return {
    id: 'p-1',
    type: 'PLAYER',
    typeName: 'Игрок',
    name: 'Ториан',
    dead: false,
    initiativeBonus: 2,
    conditions: [],
    ...overrides,
  };
}

/** Трекер с разумными значениями по умолчанию. */
function tracker(overrides: Partial<TrackerDetailed> = {}): TrackerDetailed {
  return {
    id: 'tracker-1',
    name: 'Засада у моста',
    status: 'ACTIVE',
    statusName: 'Бой',
    round: 2,
    rerollEachRound: false,
    currentParticipantId: 'p-1',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    participants: [participant()],
    ...overrides,
  };
}

describe('снимок боя для комнаты', () => {
  it('несёт очередь ходов', () => {
    const draft = toFightStateDraft(tracker());

    expect(draft).toMatchObject({
      trackerId: 'tracker-1',
      round: 2,
      active: true,
      currentParticipantId: 'p-1',
    });

    expect(draft.participants).toHaveLength(1);
  });

  it('не выдаёт существ', () => {
    const draft = toFightStateDraft(
      tracker({
        participants: [
          participant({
            id: 'c-1',
            type: 'CREATURE',
            name: 'Гоблин-вожак',
            creatureUrl: '/bestiary/goblin-boss',
            currentHitPoints: 4,
          }),
        ],
      }),
    );

    // Состав засады и запас её прочности раскрывает мастер, а не карусель.
    expect(draft.participants[0]).toMatchObject({
      name: 'Существо',
      player: false,
      avatarUrl: null,
    });

    expect(JSON.stringify(draft)).not.toContain('Гоблин');
  });

  it('оставляет персонажу его портрет', () => {
    const draft = toFightStateDraft(
      tracker({
        participants: [
          participant({
            sheetLink: {
              sheetId: 'sheet-1',
              source: 'own',
              shareToken: null,
              avatarUrl: 'https://ttg.club/torian.png',
            },
          }),
        ],
      }),
    );

    expect(draft.participants[0]).toMatchObject({
      name: 'Ториан',
      player: true,
      avatarUrl: 'https://ttg.club/torian.png',
    });
  });

  it('держит раунд в допустимых пределах', () => {
    // Бой в подготовке идёт нулевым раундом, а карусель считает от первого.
    expect(
      toFightStateDraft(tracker({ status: 'PREPARING', round: 0 })),
    ).toMatchObject({
      round: 1,
      active: false,
    });
  });

  it('разбирает снимок из комнаты', () => {
    const state = parseFightStateSafe({
      trackerId: 'tracker-1',
      title: 'Засада у моста',
      round: 3,
      active: true,
      currentParticipantId: 'p-1',
      participants: [
        {
          id: 'p-1',
          name: 'Ториан',
          player: true,
          dead: false,
          color: 'amber',
        },
      ],
      updatedAt: '2026-09-01T10:00:00Z',
    });

    // Цвета «amber» в палитре трекера нет: токен просто остаётся без цвета.
    expect(state?.participants[0]).toMatchObject({ color: null });
    expect(state?.round).toBe(3);
  });

  it('не показывает битый снимок', () => {
    expect(parseFightStateSafe({ round: 1 })).toBeNull();
  });

  it('превращает снимок в бойцов карусели', () => {
    const state = parseFightStateSafe({
      trackerId: 'tracker-1',
      title: 'Засада',
      round: 1,
      active: true,
      currentParticipantId: 'c-1',
      participants: [
        {
          id: 'c-1',
          name: 'Существо',
          player: false,
          dead: true,
          color: 'error',
        },
      ],
      updatedAt: '2026-09-01T10:00:00Z',
    });

    expect(state && toReelParticipants(state)).toEqual([
      {
        id: 'c-1',
        type: 'CREATURE',
        name: 'Существо',
        dead: true,
        color: 'error',
        avatarUrl: undefined,
      },
    ]);
  });
});
