import type {
  Game,
  GameRegistration,
  GameSession,
  SessionParticipant,
} from '~find-game/model';

import { describe, expect, it } from 'vitest';

import {
  resolveGameViewerAbilities,
  resolveGameViewerRole,
  resolveSessionAbilities,
} from '~find-game/model';

const MASTER_ID = 'master-1';
const PLAYER_ID = 'player-1';
const SESSION_ID = 'session-1';
const GAME_ID = 'game-1';

/** Игра с настройками по умолчанию: публичная, открытая, платная. */
function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: GAME_ID,
    masterId: MASTER_ID,
    title: 'Игра',
    system: 'DND_2024',
    imageUrl: null,
    virtualTableUrl: null,
    genre: null,
    description: 'Описание',
    requirements: 'Требования',
    allowedSources: [],
    type: 'ONLINE',
    city: null,
    playersToStart: 3,
    maxPlayers: 5,
    takenSeats: 0,
    approvedSeats: 0,
    minAge: null,
    maxAge: null,
    startingLevel: 1,
    crossplayAllowed: false,
    status: 'OPEN',
    durationType: 'CAMPAIGN',
    costType: 'PAID',
    visibility: 'PUBLIC',
    inviteCode: null,
    createdAt: '2026-08-01T10:00:00Z',
    listPositionAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
    ...overrides,
  };
}

/** Запланированная сессия без участников. */
function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: SESSION_ID,
    gameId: GAME_ID,
    title: 'Сессия',
    startsAt: '2026-09-05T16:00:00Z',
    estimatedDurationMinutes: 240,
    status: 'SCHEDULED',
    priceAmount: 15,
    priceCurrency: 'EUR',
    paymentType: 'PREPAYMENT',
    registeredPlayerIds: [],
    ...overrides,
  };
}

/** Заявка игрока в игру с заданным состоянием. */
function makeRegistration(
  overrides: Partial<GameRegistration> = {},
): GameRegistration {
  return {
    id: 'reg-1',
    gameId: GAME_ID,
    playerId: PLAYER_ID,
    characterSheetUrl: null,
    characterName: null,
    status: 'PENDING',
    createdAt: '2026-08-30T10:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z',
    ...overrides,
  };
}

/** Участие игрока во встрече. */
function makeParticipant(
  overrides: Partial<SessionParticipant> = {},
): SessionParticipant {
  return {
    id: 'part-1',
    sessionId: SESSION_ID,
    playerId: PLAYER_ID,
    attendanceStatus: 'NOT_ATTENDING',
    paid: false,
    paidAt: null,
    createdAt: '2026-08-30T10:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z',
    ...overrides,
  };
}

/** Права мастера-владельца игры. */
function masterOf(game: Game) {
  return resolveGameViewerAbilities({
    game,
    userId: MASTER_ID,
    roles: ['USER'],
    registration: null,
  });
}

/**
 * Права пользователя с заданной заявкой.
 * @param game Игра.
 * @param registration Заявка пользователя; `null` — заявки не было.
 */
function viewerOf(game: Game, registration: GameRegistration | null) {
  return resolveGameViewerAbilities({
    game,
    userId: PLAYER_ID,
    roles: ['USER'],
    registration,
  });
}

describe('роль на странице игры', () => {
  const game = makeGame();

  it('гость — тот, кто не вошёл', () => {
    expect(
      resolveGameViewerRole({
        game,
        userId: null,
        roles: [],
        registration: null,
      }),
    ).toBe('guest');
  });

  it('мастер узнаётся по владельцу игры', () => {
    expect(
      resolveGameViewerRole({
        game,
        userId: MASTER_ID,
        roles: ['USER'],
        registration: null,
      }),
    ).toBe('master');
  });

  it('игрок — тот, чью заявку приняли', () => {
    // Только принятая заявка делает игроком: по составу встречи нельзя
    // отличить ожидающего от отклонённого.
    expect(
      resolveGameViewerRole({
        game,
        userId: PLAYER_ID,
        roles: ['USER'],
        registration: makeRegistration({ status: 'APPROVED' }),
      }),
    ).toBe('player');
  });

  it('с неразобранной заявкой пользователь ещё не игрок', () => {
    expect(
      resolveGameViewerRole({
        game,
        userId: PLAYER_ID,
        roles: ['USER'],
        registration: makeRegistration(),
      }),
    ).toBe('visitor');
  });
});

describe('заявка в игру', () => {
  const game = makeGame();

  it('подаётся один раз: со второй кнопки нет', () => {
    expect(viewerOf(game, null).canApply).toBe(true);
    expect(viewerOf(game, makeRegistration()).canApply).toBe(false);

    expect(
      viewerOf(game, makeRegistration({ status: 'REJECTED' })).canApply,
    ).toBe(false);
  });

  it('мастер в собственную игру не записывается', () => {
    expect(masterOf(game).canApply).toBe(false);
  });

  it('гостю предлагается войти, а не подать заявку', () => {
    const abilities = resolveGameViewerAbilities({
      game,
      userId: null,
      roles: [],
      registration: null,
    });

    expect(abilities.canApply).toBe(false);
    expect(abilities.needsSignIn).toBe(true);
  });

  it('отозвать можно только неразобранную', () => {
    // Принятое место согласовано, и тихий уход подвёл бы группу.
    expect(viewerOf(game, makeRegistration()).canWithdraw).toBe(true);

    expect(
      viewerOf(game, makeRegistration({ status: 'APPROVED' })).canWithdraw,
    ).toBe(false);

    expect(
      viewerOf(game, makeRegistration({ status: 'REJECTED' })).canWithdraw,
    ).toBe(false);
  });

  it('состояние заявки видно отдельными признаками', () => {
    expect(viewerOf(game, makeRegistration()).isPending).toBe(true);

    expect(
      viewerOf(game, makeRegistration({ status: 'REJECTED' })).isRejected,
    ).toBe(true);

    expect(
      viewerOf(game, makeRegistration({ status: 'APPROVED' })).isApprovedPlayer,
    ).toBe(true);
  });
});

describe('права мастера на игру', () => {
  it('правит, ведёт сессии и разбирает заявки только владелец', () => {
    const game = makeGame();
    const master = masterOf(game);
    const visitor = viewerOf(game, null);

    expect(master.canEditGame).toBe(true);
    expect(master.canCreateSession).toBe(true);
    expect(master.canReviewRegistrations).toBe(true);
    expect(visitor.canEditGame).toBe(false);
    expect(visitor.canCreateSession).toBe(false);
    expect(visitor.canReviewRegistrations).toBe(false);
  });

  it('оплату отмечают только в платной игре', () => {
    expect(masterOf(makeGame()).canManagePayments).toBe(true);

    expect(masterOf(makeGame({ costType: 'FREE' })).canManagePayments).toBe(
      false,
    );
  });

  it('поднять можно только открытую публичную игру', () => {
    expect(masterOf(makeGame()).canRaiseGame).toBe(true);
    expect(masterOf(makeGame({ status: 'CLOSED' })).canRaiseGame).toBe(false);

    expect(masterOf(makeGame({ visibility: 'PRIVATE' })).canRaiseGame).toBe(
      false,
    );
  });

  it('закрыть игру можно один раз', () => {
    // Завершением или отменой — но не дважды.
    for (const status of ['CLOSED', 'CANCELLED'] as const) {
      const abilities = masterOf(makeGame({ status }));

      expect(abilities.canCloseGame).toBe(false);
      expect(abilities.canCancelGame).toBe(false);
    }

    expect(masterOf(makeGame()).canCloseGame).toBe(true);
    expect(masterOf(makeGame()).canCancelGame).toBe(true);
  });
});

describe('общий чат игры', () => {
  const game = makeGame();

  it('открыт уже подавшему заявку', () => {
    // До решения мастера игроку есть о чём с ним говорить.
    expect(viewerOf(game, makeRegistration()).canUseGameChat).toBe(true);
  });

  it('закрыт тому, кто заявку не подавал или получил отказ', () => {
    expect(viewerOf(game, null).canUseGameChat).toBe(false);

    expect(
      viewerOf(game, makeRegistration({ status: 'REJECTED' })).canUseGameChat,
    ).toBe(false);
  });

  it('мастеру открыт всегда', () => {
    expect(masterOf(game).canUseGameChat).toBe(true);
  });
});

describe('игровая комната', () => {
  const game = makeGame();

  it('открыта мастеру и подавшему заявку', () => {
    expect(masterOf(game).canOpenNexus).toBe(true);
    expect(viewerOf(game, makeRegistration()).canOpenNexus).toBe(true);
  });

  it('закрыта постороннему и получившему отказ', () => {
    expect(viewerOf(game, null).canOpenNexus).toBe(false);

    expect(
      viewerOf(game, makeRegistration({ status: 'REJECTED' })).canOpenNexus,
    ).toBe(false);
  });
});

describe('участие во встрече', () => {
  const game = makeGame();

  it('присутствие отмечает только тот, кто в составе', () => {
    const participant = resolveSessionAbilities(
      makeSession(),
      game,
      makeParticipant(),
      viewerOf(game, makeRegistration({ status: 'APPROVED' })),
    );

    const outsider = resolveSessionAbilities(
      makeSession(),
      game,
      null,
      viewerOf(game, makeRegistration()),
    );

    expect(participant.canChangeAttendance).toBe(true);
    expect(outsider.canChangeAttendance).toBe(false);
  });

  it('в закрытой встрече присутствие уже не меняют', () => {
    for (const status of ['COMPLETED', 'CANCELLED'] as const) {
      const abilities = resolveSessionAbilities(
        makeSession({ status }),
        game,
        makeParticipant(),
        viewerOf(game, makeRegistration({ status: 'APPROVED' })),
      );

      expect(abilities.canChangeAttendance).toBe(false);
    }
  });

  it('заполненность считается по составу встречи', () => {
    const abilities = resolveSessionAbilities(
      makeSession({ registeredPlayerIds: ['a', 'b', 'c', 'd', 'e'] }),
      game,
      null,
      masterOf(game),
    );

    expect(abilities.participantCount).toBe(5);
    expect(abilities.freeSlots).toBe(0);
    expect(abilities.isFull).toBe(true);
  });
});

describe('чат сессии по её состоянию', () => {
  const game = makeGame();

  it('запланированная сессия чат ещё не открывает', () => {
    // До начала игрокам нечего обсуждать, а состав может смениться.
    const master = resolveSessionAbilities(
      makeSession(),
      game,
      null,
      masterOf(game),
    );

    const player = resolveSessionAbilities(
      makeSession(),
      game,
      makeParticipant(),
      viewerOf(game, makeRegistration({ status: 'APPROVED' })),
    );

    expect(master.canUseSessionChat).toBe(false);
    expect(player.canUseSessionChat).toBe(false);
  });

  it('идущая, завершённая и отменённая сессия чат открывают', () => {
    // История переписки нужна и после того, как встреча закончилась.
    for (const status of ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const) {
      const master = resolveSessionAbilities(
        makeSession({ status }),
        game,
        null,
        masterOf(game),
      );

      const player = resolveSessionAbilities(
        makeSession({ status }),
        game,
        makeParticipant(),
        viewerOf(game, makeRegistration({ status: 'APPROVED' })),
      );

      expect(master.canUseSessionChat).toBe(true);
      expect(player.canUseSessionChat).toBe(true);
    }
  });

  it('посторонний в чат идущей сессии не попадает', () => {
    const abilities = resolveSessionAbilities(
      makeSession({ status: 'IN_PROGRESS' }),
      game,
      null,
      viewerOf(game, null),
    );

    expect(abilities.canUseSessionChat).toBe(false);
  });
});

describe('состояния сессии у мастера', () => {
  const game = makeGame();

  it('начать можно только запланированную', () => {
    expect(
      resolveSessionAbilities(makeSession(), game, null, masterOf(game))
        .canStart,
    ).toBe(true);

    expect(
      resolveSessionAbilities(
        makeSession({ status: 'IN_PROGRESS' }),
        game,
        null,
        masterOf(game),
      ).canStart,
    ).toBe(false);
  });

  it('закрыть можно всё, кроме уже закрытой', () => {
    for (const status of ['SCHEDULED', 'IN_PROGRESS'] as const) {
      const abilities = resolveSessionAbilities(
        makeSession({ status }),
        game,
        null,
        masterOf(game),
      );

      expect(abilities.canComplete).toBe(true);
      expect(abilities.canCancel).toBe(true);
    }

    for (const status of ['COMPLETED', 'CANCELLED'] as const) {
      const abilities = resolveSessionAbilities(
        makeSession({ status }),
        game,
        null,
        masterOf(game),
      );

      expect(abilities.canComplete).toBe(false);
      expect(abilities.canCancel).toBe(false);
    }
  });

  it('дату назначают один раз и только набору с открытой датой', () => {
    expect(
      resolveSessionAbilities(
        makeSession({ startsAt: null }),
        game,
        null,
        masterOf(game),
      ).canSchedule,
    ).toBe(true);

    expect(
      resolveSessionAbilities(makeSession(), game, null, masterOf(game))
        .canSchedule,
    ).toBe(false);
  });

  it('игрок состояние сессии не меняет', () => {
    const abilities = resolveSessionAbilities(
      makeSession(),
      game,
      makeParticipant(),
      viewerOf(game, makeRegistration({ status: 'APPROVED' })),
    );

    expect(abilities.canStart).toBe(false);
    expect(abilities.canComplete).toBe(false);
    expect(abilities.canCancel).toBe(false);
    expect(abilities.canSchedule).toBe(false);
  });
});
