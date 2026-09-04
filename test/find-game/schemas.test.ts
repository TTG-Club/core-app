import { describe, expect, it, vi } from 'vitest';

import {
  getGameSeatsCounter,
  parseCities,
  parseFindGameProfile,
  parseGame,
  parseGameRegistration,
  parseGameSessions,
  parseGamesPage,
  parseMasterProfile,
  parseProblemDetail,
  parseSessionParticipant,
} from '~find-game/model';

/** Ответ игры в том виде, в каком его отдаёт find-game-api. */
function gameResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    masterId: '55555555-5555-4555-8555-555555555555',
    title: 'Проклятие Страда',
    system: 'DND_2024',
    imageUrl: null,
    virtualTableUrl: null,
    genre: 'Готическое фэнтези',
    description: 'Кампания',
    requirements: 'Совершеннолетние',
    allowedSources: ["Player's Handbook 2024"],
    type: 'ONLINE',
    city: null,
    playersToStart: 3,
    maxPlayers: 5,
    minAge: 18,
    maxAge: 99,
    startingLevel: 1,
    crossplayAllowed: true,
    status: 'OPEN',
    durationType: 'CAMPAIGN',
    costType: 'PAID',
    visibility: 'PUBLIC',
    createdAt: '2026-08-01T10:00:00Z',
    listPositionAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
    ...overrides,
  };
}

describe('разбор игры', () => {
  it('приводит ответ сервиса к доменной игре', () => {
    const game = parseGame(gameResponse());

    expect(game.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(game.system).toBe('DND_2024');
    expect(game.allowedSources).toEqual(["Player's Handbook 2024"]);
    expect(game.inviteCode).toBeNull();
  });

  it('подставляет null вместо отсутствующих необязательных полей', () => {
    const game = parseGame(
      gameResponse({
        genre: undefined,
        minAge: undefined,
        allowedSources: undefined,
      }),
    );

    expect(game.genre).toBeNull();
    expect(game.minAge).toBeNull();
    expect(game.allowedSources).toEqual([]);
  });

  it('переживает отсутствие listPositionAt на старой сборке сервиса', () => {
    const game = parseGame(gameResponse({ listPositionAt: undefined }));

    expect(game.listPositionAt).toBeNull();
  });

  it('сохраняет код приглашения, когда сервис его вернул', () => {
    const inviteCode = '33333333-3333-4333-8333-333333333333';
    const game = parseGame(gameResponse({ visibility: 'PRIVATE', inviteCode }));

    expect(game.inviteCode).toBe(inviteCode);
  });

  it('заменяет незнакомое значение перечисления безопасным, а не роняет разбор', () => {
    // Сборка сервиса новее фронта: показать игру без точной пометки лучше,
    // чем спрятать её целиком.
    const game = parseGame(gameResponse({ status: 'ARCHIVED' }));

    expect(game.status).toBe('OPEN');
  });

  it('без идентификатора игра не разбирается', () => {
    expect(() => parseGame(gameResponse({ id: undefined }))).toThrow();
  });

  it('несёт ссылки на разговоры', () => {
    const game = parseGame(
      gameResponse({
        masterChatUrl: 'https://t.me/master',
        gameChatUrl: 'https://t.me/+strahd-party',
      }),
    );

    expect(game.masterChatUrl).toBe('https://t.me/master');
    expect(game.gameChatUrl).toBe('https://t.me/+strahd-party');
  });

  it('оставляет чат игры пустым, когда сервис его не отдал', () => {
    // Чат игры принадлежит принятым игрокам: остальным сервис поля не
    // присылает вовсе, и ссылки в объявлении просто нет.
    const game = parseGame(gameResponse({ gameChatUrl: undefined }));

    expect(game.gameChatUrl).toBeNull();
  });
});

describe('профиль мастера', () => {
  it('разбирает рассказ о себе и счётчики игр', () => {
    const profile = parseMasterProfile({
      userId: '55555555-5555-4555-8555-555555555555',
      about: 'Вожу с 2015 года',
      tabletopExperienceYears: 10,
      recruitingGames: 2,
      closedGames: 7,
      cancelledGames: 1,
      completedSessions: 34,
    });

    expect(profile.about).toBe('Вожу с 2015 года');
    expect(profile.tabletopExperienceYears).toBe(10);
    expect(profile.recruitingGames).toBe(2);
    expect(profile.completedSessions).toBe(34);
  });

  it('переживает мастера без рассказа о себе', () => {
    // Мастер водит, ничего о себе не написав: счётчики всё равно нужны.
    const profile = parseMasterProfile({
      userId: '55555555-5555-4555-8555-555555555555',
      recruitingGames: 1,
    });

    expect(profile.about).toBeNull();
    expect(profile.tabletopExperienceYears).toBeNull();
    expect(profile.closedGames).toBe(0);
  });
});

describe('справочник городов', () => {
  it('разбирает подсказки', () => {
    const cities = parseCities([
      { name: 'Москва', region: null, country: 'Россия' },
      {
        name: 'Ростов-на-Дону',
        region: 'Ростовская область',
        country: 'Россия',
      },
    ]);

    expect(cities).toEqual([
      { name: 'Москва', region: null, country: 'Россия' },
      {
        name: 'Ростов-на-Дону',
        region: 'Ростовская область',
        country: 'Россия',
      },
    ]);
  });

  it('выкидывает битую подсказку, а не весь список', () => {
    // Из-за одной записи без названия список подсказок пропадать не должен.
    const cities = parseCities([{ country: 'Россия' }, { name: 'Казань' }]);

    expect(cities).toHaveLength(1);
    expect(cities[0]?.name).toBe('Казань');
  });

  it('переживает ответ не массивом', () => {
    expect(parseCities(null)).toEqual([]);
  });
});

describe('занятость мест', () => {
  it('читается из ответа', () => {
    const game = parseGame(gameResponse({ takenSeats: 3, approvedSeats: 1 }));

    expect(game.takenSeats).toBe(3);
    expect(game.approvedSeats).toBe(1);
  });

  it('на сборке сервиса без подсчёта заявок считается нулевой', () => {
    // Поле появилось позже самой игры: без него карточка показывает пустые
    // места, а не падает на разборе.
    const game = parseGame(gameResponse());

    expect(game.takenSeats).toBe(0);
    expect(game.approvedSeats).toBe(0);
  });

  it('у большого состава читается счётчиком', () => {
    // Пятнадцать значков в карточке не читаются и не рисуются — но пустой ряд
    // мест не говорит ничего, набрана группа или нет.
    const game = parseGame(
      gameResponse({ maxPlayers: 15, takenSeats: 3, approvedSeats: 2 }),
    );

    expect(getGameSeatsCounter(game)).toBe('3 / 15');
  });
});

describe('разбор страницы каталога', () => {
  it('читает содержимое и счётчики Spring-пагинации', () => {
    const page = parseGamesPage({
      content: [gameResponse()],
      totalElements: 42,
      totalPages: 4,
      number: 1,
      size: 12,
      first: false,
      last: false,
    });

    expect(page.content).toHaveLength(1);
    expect(page.totalElements).toBe(42);
    expect(page.number).toBe(1);
  });

  it('читает счётчики из вложенного page — форма Spring Boot 4', () => {
    // Живой сервис отдаёт именно так. Если читать только плоские поля,
    // каталог показывает «0 игр» и не рисует пагинацию при непустой выдаче.
    const page = parseGamesPage({
      content: [gameResponse()],
      page: { size: 12, number: 2, totalElements: 42, totalPages: 4 },
    });

    expect(page.content).toHaveLength(1);
    expect(page.totalElements).toBe(42);
    expect(page.totalPages).toBe(4);
    expect(page.number).toBe(2);
    expect(page.size).toBe(12);
    expect(page.first).toBe(false);
    expect(page.last).toBe(false);
  });

  it('выводит first и last, которых в новой форме нет', () => {
    const onlyPage = parseGamesPage({
      content: [],
      page: { size: 12, number: 0, totalElements: 0, totalPages: 0 },
    });

    expect(onlyPage.first).toBe(true);
    expect(onlyPage.last).toBe(true);

    const lastPage = parseGamesPage({
      content: [gameResponse()],
      page: { size: 12, number: 3, totalElements: 42, totalPages: 4 },
    });

    expect(lastPage.last).toBe(true);
  });

  it('выбрасывает битую игру поштучно, сохраняя остальную выдачу', () => {
    const warn = vi.spyOn(consola, 'warn').mockImplementation(() => undefined);

    const page = parseGamesPage({
      content: [gameResponse(), { id: null }, gameResponse({ id: 'second' })],
      totalElements: 3,
      totalPages: 1,
      number: 0,
      size: 12,
      first: true,
      last: true,
    });

    // Одна запись без идентификатора не должна превращать каталог в пустой.
    expect(page.content).toHaveLength(2);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('битый ответ страницы даёт пустую выдачу, а не исключение', () => {
    const page = parseGamesPage('не страница');

    expect(page.content).toEqual([]);
    expect(page.totalElements).toBe(0);
  });
});

describe('разбор сессий', () => {
  it('читает стоимость и условия оплаты платной сессии', () => {
    const [session] = parseGameSessions([
      {
        id: '44444444-4444-4444-8444-444444444444',
        gameId: '11111111-1111-4111-8111-111111111111',
        title: 'Знакомство с Баровией',
        startsAt: '2026-09-05T16:00:00Z',
        estimatedDurationMinutes: 240,
        status: 'SCHEDULED',
        priceAmount: 15.5,
        priceCurrency: 'EUR',
        paymentType: 'PREPAYMENT',
        registeredPlayerIds: ['player-1'],
      },
    ]);

    expect(session?.priceAmount).toBe(15.5);
    expect(session?.paymentType).toBe('PREPAYMENT');
    expect(session?.registeredPlayerIds).toEqual(['player-1']);
  });

  it('у бесплатной сессии платёжных полей нет', () => {
    const [session] = parseGameSessions([
      {
        id: '44444444-4444-4444-8444-444444444444',
        gameId: '11111111-1111-4111-8111-111111111111',
        title: 'Ваншот',
        startsAt: '2026-09-05T16:00:00Z',
        status: 'SCHEDULED',
      },
    ]);

    expect(session?.priceAmount).toBeNull();
    expect(session?.priceCurrency).toBeNull();
    expect(session?.paymentType).toBeNull();
    expect(session?.registeredPlayerIds).toEqual([]);
  });

  it('у набора с открытой датой начала нет', () => {
    // Jackson не сериализует null-поля, поэтому у такой сессии ключа
    // `startsAt` в ответе просто нет.
    const [session] = parseGameSessions([
      {
        id: '44444444-4444-4444-8444-444444444444',
        gameId: '11111111-1111-4111-8111-111111111111',
        title: 'Набор в кампанию',
        status: 'SCHEDULED',
      },
    ]);

    expect(session?.startsAt).toBeNull();
  });
});

describe('разбор заявки в игру', () => {
  const GAME_ID = '11111111-1111-4111-8111-111111111111';
  const PLAYER_ID = '99999999-9999-4999-8999-999999999999';
  const REGISTRATION_ID = '77777777-7777-4777-8777-777777777777';

  it('читает статус и лист персонажа', () => {
    const registration = parseGameRegistration({
      id: REGISTRATION_ID,
      gameId: GAME_ID,
      playerId: PLAYER_ID,
      characterSheetUrl: '/tools/character-sheet/shared/9d1f1d0e',
      status: 'APPROVED',
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
    });

    expect(registration.status).toBe('APPROVED');

    expect(registration.characterSheetUrl).toBe(
      '/tools/character-sheet/shared/9d1f1d0e',
    );
  });

  it('читает имя персонажа вместо листа', () => {
    // Листа на сайте может и не быть: игрок называет персонажа словами.
    const registration = parseGameRegistration({
      id: REGISTRATION_ID,
      gameId: GAME_ID,
      playerId: PLAYER_ID,
      characterName: 'Тассельхоф Непоседа',
      status: 'PENDING',
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-08-30T10:00:00Z',
    });

    expect(registration.characterName).toBe('Тассельхоф Непоседа');
    expect(registration.characterSheetUrl).toBeNull();
  });

  it('читает причину отказа, названную мастером', () => {
    const registration = parseGameRegistration({
      id: REGISTRATION_ID,
      gameId: GAME_ID,
      playerId: PLAYER_ID,
      status: 'REJECTED',
      rejectionReason: 'Состав уже собран под другой стиль игры',
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
    });

    expect(registration.rejectionReason).toBe(
      'Состав уже собран под другой стиль игры',
    );
  });

  it('обходится без причины: объяснять мастер не обязан', () => {
    const registration = parseGameRegistration({
      id: REGISTRATION_ID,
      gameId: GAME_ID,
      playerId: PLAYER_ID,
      status: 'REJECTED',
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
    });

    expect(registration.rejectionReason).toBeNull();
  });
});

describe('разбор участия в сессии', () => {
  const SESSION_ID = '44444444-4444-4444-8444-444444444444';
  const PLAYER_ID = '99999999-9999-4999-8999-999999999999';
  const PARTICIPANT_ID = '66666666-6666-4666-8666-666666666666';

  it('читает присутствие и оплату', () => {
    const participant = parseSessionParticipant({
      id: PARTICIPANT_ID,
      sessionId: SESSION_ID,
      playerId: PLAYER_ID,
      attendanceStatus: 'ATTENDING',
      paid: true,
      paidAt: '2026-09-01T10:00:00Z',
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
    });

    expect(participant.attendanceStatus).toBe('ATTENDING');
    expect(participant.paid).toBe(true);
    expect(participant.paidAt).toBe('2026-09-01T10:00:00Z');
  });

  it('разбирается, когда сервис вовсе не прислал paidAt', () => {
    // `@JsonInclude(NON_NULL)` вырезает `paidAt` у неоплаченного участия, то
    // есть у большинства. Ключа в теле нет вообще — не «есть со значением
    // null», и разбор обязан это пережить.
    const participant = parseSessionParticipant({
      id: PARTICIPANT_ID,
      sessionId: SESSION_ID,
      playerId: PLAYER_ID,
      attendanceStatus: 'NOT_ATTENDING',
      paid: false,
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-08-30T10:00:00Z',
    });

    expect(participant.paid).toBe(false);
    expect(participant.paidAt).toBeNull();
  });
});

describe('разбор профиля', () => {
  it('разворачивает независимые анкеты Мастера и Игрока', () => {
    const profile = parseFindGameProfile({
      userId: 'user-1',
      birthYear: 1990,
      gender: 'MALE',
      tabletopExperienceYears: 7,
      master: { about: 'Вожу кампании' },
      player: { about: null },
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
    });

    expect(profile.masterAbout).toBe('Вожу кампании');
    expect(profile.playerAbout).toBe('');
    expect(profile.tabletopExperienceYears).toBe(7);
  });

  it('пустой профиль сразу после создания разбирается без ошибок', () => {
    const profile = parseFindGameProfile({
      userId: 'user-1',
      birthYear: null,
      gender: null,
      tabletopExperienceYears: null,
      master: { about: null },
      player: { about: null },
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
    });

    expect(profile.birthYear).toBeNull();
    expect(profile.gender).toBeNull();
    expect(profile.masterAbout).toBe('');
  });
});

describe('разбор ProblemDetail', () => {
  it('читает тело отказа сервиса', () => {
    const problem = parseProblemDetail({
      type: 'https://find-game.ttg.club/problems/409',
      title: 'Достигнут лимит активных игр',
      status: 409,
      detail: 'У мастера уже есть незавершённая игра',
    });

    expect(problem.status).toBe(409);
    expect(problem.detail).toBe('У мастера уже есть незавершённая игра');
  });

  it('читает время следующего поднятия из отказа 429', () => {
    const problem = parseProblemDetail({
      status: 429,
      title: 'Игру пока нельзя поднять',
      detail: 'Поднять можно позже',
      availableAt: '2026-08-27T10:00:00Z',
    });

    expect(problem.availableAt).toBe('2026-08-27T10:00:00Z');
  });

  it('читает отказ без availableAt — то есть любой, кроме 429', () => {
    // Ключа `availableAt` в обычном отказе нет вовсе. Если разбор об этом
    // спотыкается, пользователь вместо причины видит общую заглушку.
    const problem = parseProblemDetail({
      type: 'https://find-game.ttg.club/problems/403',
      title: 'Доступ запрещён',
      status: 403,
      detail: 'Только мастер-владелец может обрабатывать заявки',
    });

    expect(problem.status).toBe(403);

    expect(problem.detail).toBe(
      'Только мастер-владелец может обрабатывать заявки',
    );

    expect(problem.availableAt).toBeNull();
  });

  it('непригодное тело даёт пустой ProblemDetail вместо исключения', () => {
    const problem = parseProblemDetail('<html>502 Bad Gateway</html>');

    expect(problem.detail).toBeNull();
    expect(problem.status).toBeNull();
  });
});
