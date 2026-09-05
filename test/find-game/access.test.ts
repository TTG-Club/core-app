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
    masterChatUrl: null,
    gameChatUrl: null,
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
    recruitmentClosed: false,
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
    completedAt: null,
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

describe('набор в игру', () => {
  /** Игра, где принято `approvedSeats` игроков из пяти мест. */
  function gathered(
    approvedSeats: number,
    overrides: Partial<Game> = {},
  ): Game {
    return makeGame({
      approvedSeats,
      takenSeats: approvedSeats,
      ...overrides,
    });
  }

  it('закрывается досрочно с первым принятым игроком', () => {
    expect(masterOf(gathered(1)).canCloseRecruitment).toBe(true);
  });

  it('не закрывается, пока никого не приняли', () => {
    // Объявление без единого игрока исчезло бы из поиска, ничего не собрав.
    expect(masterOf(gathered(0)).canCloseRecruitment).toBe(false);
  });

  it('полный стол закрывать нечем — он закрыт сам', () => {
    expect(masterOf(gathered(5)).canCloseRecruitment).toBe(false);
    expect(masterOf(gathered(5)).canOpenRecruitment).toBe(false);
  });

  it('открывается снова, пока есть свободное место', () => {
    const closed = gathered(3, { recruitmentClosed: true });

    expect(masterOf(closed).canOpenRecruitment).toBe(true);
    expect(masterOf(closed).canCloseRecruitment).toBe(false);
  });

  it('набором управляет только мастер', () => {
    const closed = gathered(3, { recruitmentClosed: true });

    expect(viewerOf(gathered(3), null).canCloseRecruitment).toBe(false);
    expect(viewerOf(closed, null).canOpenRecruitment).toBe(false);
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
  });
});

describe('оценка встречи', () => {
  const game = makeGame();
  const dayMillis = 24 * 60 * 60 * 1000;

  /**
   * Встреча, закрытая заданное число дней назад.
   * @param daysAgo Сколько дней прошло с закрытия.
   */
  function completedDaysAgo(daysAgo: number): GameSession {
    return makeSession({
      status: 'COMPLETED',
      completedAt: new Date(Date.now() - daysAgo * dayMillis).toISOString(),
      registeredPlayerIds: [PLAYER_ID],
    });
  }

  it('мастер оценивает свежую встречу с игроками', () => {
    const abilities = resolveSessionAbilities(
      completedDaysAgo(1),
      game,
      null,
      masterOf(game),
    );

    expect(abilities.canReview).toBe(true);
  });

  it('игрок оценивает встречу, в которой был', () => {
    const abilities = resolveSessionAbilities(
      completedDaysAgo(1),
      game,
      makeParticipant(),
      viewerOf(game, makeRegistration({ status: 'APPROVED' })),
    );

    expect(abilities.canReview).toBe(true);
  });

  it('не участвовавший не оценивает', () => {
    // Оценку ставит тот, кто был за столом, — иначе она ни о чём.
    const abilities = resolveSessionAbilities(
      completedDaysAgo(1),
      game,
      null,
      viewerOf(game, makeRegistration({ status: 'REJECTED' })),
    );

    expect(abilities.canReview).toBe(false);
  });

  it('незакрытую встречу не оценивают', () => {
    const abilities = resolveSessionAbilities(
      makeSession({ status: 'IN_PROGRESS', registeredPlayerIds: [PLAYER_ID] }),
      game,
      null,
      masterOf(game),
    );

    expect(abilities.canReview).toBe(false);
  });

  it('через две недели окно закрыто', () => {
    const abilities = resolveSessionAbilities(
      completedDaysAgo(20),
      game,
      null,
      masterOf(game),
    );

    expect(abilities.canReview).toBe(false);
  });

  it('мастеру пустого стола оценивать некого', () => {
    const abilities = resolveSessionAbilities(
      makeSession({
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        registeredPlayerIds: [],
      }),
      game,
      null,
      masterOf(game),
    );

    expect(abilities.canReview).toBe(false);
  });

  it('встреча без отметки закрытия оценке не подлежит', () => {
    // Такие остались от времён до оценок: отсчитывать окно не от чего.
    const abilities = resolveSessionAbilities(
      makeSession({
        status: 'COMPLETED',
        completedAt: null,
        registeredPlayerIds: [PLAYER_ID],
      }),
      game,
      null,
      masterOf(game),
    );

    expect(abilities.canReview).toBe(false);
  });
});
