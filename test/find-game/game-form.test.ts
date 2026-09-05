import type { CreateGameRequest } from '~find-game/model';

import { describe, expect, it } from 'vitest';

import {
  createGameRequestSchema,
  fromLocalDateTimeInput,
  getDefaultSessionStart,
  getGameAgeLabel,
  getGameFormatLabel,
  getGameInviteLink,
  getGamePlayersLabel,
  getGameRoute,
  getSessionDurationLabel,
  getSessionPriceLabel,
  toLocalDateTimeInput,
} from '~find-game/model';

/** Онлайн-игра без города: минимально допустимое тело создания. */
function onlineGame(
  overrides: Partial<CreateGameRequest> = {},
): CreateGameRequest {
  return {
    title: 'Проклятие Страда',
    system: 'DND_2024',
    description: 'Готическая кампания',
    requirements: 'Совершеннолетние игроки',
    type: 'ONLINE',
    playersToStart: 3,
    maxPlayers: 5,
    startingLevel: 1,
    crossplayAllowed: false,
    durationType: 'CAMPAIGN',
    costType: 'FREE',
    visibility: 'PUBLIC',
    ...overrides,
  };
}

describe('тело создания игры', () => {
  it('минимальная онлайн-игра проходит проверку', () => {
    const parsed = createGameRequestSchema.parse(onlineGame());

    expect(parsed.title).toBe('Проклятие Страда');
    expect(parsed.city).toBeUndefined();
  });

  it('город допустим только у игры вживую', () => {
    // Сервис отвергает город у ONLINE, а у TEXT он не имеет смысла.
    expect(() =>
      createGameRequestSchema.parse(onlineGame({ city: 'Кишинёв' })),
    ).toThrow();

    expect(() =>
      createGameRequestSchema.parse(
        onlineGame({ type: 'TEXT', city: 'Кишинёв' }),
      ),
    ).toThrow();

    const offline = createGameRequestSchema.parse(
      onlineGame({ type: 'OFFLINE', city: 'Кишинёв' }),
    );

    expect(offline.city).toBe('Кишинёв');
  });

  it('игроков для старта не может быть больше максимума', () => {
    expect(() =>
      createGameRequestSchema.parse(
        onlineGame({ playersToStart: 6, maxPlayers: 5 }),
      ),
    ).toThrow();

    expect(() =>
      createGameRequestSchema.parse(
        onlineGame({ playersToStart: 5, maxPlayers: 5 }),
      ),
    ).not.toThrow();
  });

  it('минимальный возраст не может превышать максимальный', () => {
    expect(() =>
      createGameRequestSchema.parse(onlineGame({ minAge: 30, maxAge: 18 })),
    ).toThrow();
  });

  it('возрастные границы независимы', () => {
    expect(
      createGameRequestSchema.parse(onlineGame({ minAge: 18 })).minAge,
    ).toBe(18);

    expect(
      createGameRequestSchema.parse(onlineGame({ maxAge: 30 })).maxAge,
    ).toBe(30);

    expect(createGameRequestSchema.parse(onlineGame()).minAge).toBeUndefined();
  });

  it('стартовый уровень ограничен диапазоном 1–20', () => {
    expect(() =>
      createGameRequestSchema.parse(onlineGame({ startingLevel: 0 })),
    ).toThrow();

    expect(() =>
      createGameRequestSchema.parse(onlineGame({ startingLevel: 21 })),
    ).toThrow();

    expect(() =>
      createGameRequestSchema.parse(onlineGame({ startingLevel: 20 })),
    ).not.toThrow();
  });

  it('пустое название и описание не проходят', () => {
    expect(() =>
      createGameRequestSchema.parse(onlineGame({ title: '   ' })),
    ).toThrow();

    expect(() =>
      createGameRequestSchema.parse(onlineGame({ description: '' })),
    ).toThrow();

    expect(() =>
      createGameRequestSchema.parse(onlineGame({ requirements: '  ' })),
    ).toThrow();
  });

  it('слишком длинное название не проходит', () => {
    expect(() =>
      createGameRequestSchema.parse(onlineGame({ title: 'а'.repeat(151) })),
    ).toThrow();
  });

  it('пустые необязательные поля превращаются в отсутствующие', () => {
    // Иначе сервис получил бы пустую строку там, где ждёт URL, и ответил 400.
    const parsed = createGameRequestSchema.parse(
      onlineGame({ imageUrl: '', genre: '   ', virtualTableUrl: '' }),
    );

    expect(parsed.imageUrl).toBeUndefined();
    expect(parsed.genre).toBeUndefined();
    expect(parsed.virtualTableUrl).toBeUndefined();
  });

  it('источников не больше пятидесяти', () => {
    const tooMany = Array.from({ length: 51 }, (_, index) => `Книга ${index}`);

    expect(() =>
      createGameRequestSchema.parse(onlineGame({ allowedSources: tooMany })),
    ).toThrow();
  });

  it('платность игры задаётся типом, без суммы', () => {
    // Сумма и условия оплаты живут у сессии, а не у игры.
    const paid = createGameRequestSchema.parse(
      onlineGame({ costType: 'PAID' }),
    );

    expect(paid.costType).toBe('PAID');
    expect('priceAmount' in paid).toBe(false);
  });

  it('приватная игра отличается только видимостью', () => {
    const parsed = createGameRequestSchema.parse(
      onlineGame({ visibility: 'PRIVATE' }),
    );

    expect(parsed.visibility).toBe('PRIVATE');
  });
});

describe('подписи игры', () => {
  const game = {
    type: 'OFFLINE' as const,
    city: 'Кишинёв',
    playersToStart: 3,
    maxPlayers: 5,
    minAge: null,
    maxAge: null,
  };

  it('к формату игры вживую добавляется город', () => {
    expect(getGameFormatLabel({ ...game } as never)).toBe('Вживую, Кишинёв');
  });

  it('у онлайн-игры город не показывается', () => {
    expect(
      getGameFormatLabel({ ...game, type: 'ONLINE', city: null } as never),
    ).toBe('Онлайн');
  });

  it('количество игроков показывается диапазоном', () => {
    expect(getGamePlayersLabel({ ...game } as never)).toBe('3–5 игроков');
  });

  it('при совпадении границ показывается одно число', () => {
    expect(
      getGamePlayersLabel({
        ...game,
        playersToStart: 4,
        maxPlayers: 4,
      } as never),
    ).toBe('4 игрока');
  });

  it('возраст показывается по заданным границам', () => {
    expect(getGameAgeLabel({ ...game, minAge: 18, maxAge: 30 } as never)).toBe(
      '18–30 лет',
    );

    expect(
      getGameAgeLabel({ ...game, minAge: 18, maxAge: null } as never),
    ).toBe('18+');

    expect(
      getGameAgeLabel({ ...game, minAge: null, maxAge: 30 } as never),
    ).toBe('до 30 лет');

    expect(getGameAgeLabel({ ...game } as never)).toBeNull();
  });
});

describe('подписи сессии', () => {
  it('у платной сессии показывается сумма, валюта и условие оплаты', () => {
    const label = getSessionPriceLabel({
      priceAmount: 15,
      priceCurrency: 'EUR',
      paymentType: 'PREPAYMENT',
    } as never);

    expect(label).toBe('15.00 EUR · Предоплата');
  });

  it('у бесплатной сессии стоимости нет', () => {
    const label = getSessionPriceLabel({
      priceAmount: null,
      priceCurrency: null,
      paymentType: null,
    } as never);

    expect(label).toBeNull();
  });

  it('длительность показывается часами и минутами', () => {
    expect(getSessionDurationLabel(240)).toBe('4 часа');
    expect(getSessionDurationLabel(90)).toBe('1 час 30 мин');
    expect(getSessionDurationLabel(45)).toBe('45 мин');
    expect(getSessionDurationLabel(null)).toBeNull();
  });
});

describe('время начала сессии', () => {
  it('значение поля переводится в UTC и обратно без потерь', () => {
    const local = '2026-09-05T18:30';
    const iso = fromLocalDateTimeInput(local);

    expect(iso).not.toBeNull();
    expect(toLocalDateTimeInput(iso)).toBe(local);
  });

  it('пустое и битое значение не превращаются в дату', () => {
    expect(fromLocalDateTimeInput('')).toBeNull();
    expect(fromLocalDateTimeInput('не дата')).toBeNull();
    expect(toLocalDateTimeInput(null)).toBe('');
  });
});

describe('начало сессии по умолчанию', () => {
  it('это ближайший целый час', () => {
    // Не «сегодня»: в последний час суток ближайший целый час наступает уже
    // завтра, и проверка на сегодняшнюю дату разваливалась бы каждый вечер.
    const expected = new Date();

    expected.setMinutes(0, 0, 0);
    expected.setHours(expected.getHours() + 1);

    expect(getDefaultSessionStart()).toBe(
      toLocalDateTimeInput(expected.toISOString()),
    );
  });

  it('время в будущем и на целом часе', () => {
    // Сервис требует @FutureOrPresent: «сейчас» успело бы уйти в прошлое,
    // пока мастер заполняет форму.
    const value = getDefaultSessionStart();
    const parsed = fromLocalDateTimeInput(value);

    expect(parsed).not.toBeNull();
    expect(new Date(parsed as string).getTime()).toBeGreaterThan(Date.now());
    expect(value.endsWith(':00')).toBe(true);
  });
});

describe('ссылки на игру', () => {
  it('публичная игра открывается без параметров', () => {
    expect(getGameRoute('game-1')).toBe('/games/game-1');
  });

  it('к приватной игре добавляется код приглашения', () => {
    expect(getGameRoute('game-1', 'code-1')).toBe(
      '/games/game-1?inviteCode=code-1',
    );
  });

  it('ссылка-приглашение абсолютная', () => {
    expect(getGameInviteLink('game-1', 'code-1')).toBe(
      'https://ttg.club/games/game-1?inviteCode=code-1',
    );
  });
});
