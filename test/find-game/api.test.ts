import { FetchError } from 'ofetch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createGameRegistration,
  fetchGame,
  fetchGameSessions,
  fetchOwnGameRegistration,
  getChatStreamUrl,
  getFindGameErrorMessage,
  getFindGameStatus,
} from '~find-game/model';

const INVITE_CODE = '33333333-3333-4333-8333-333333333333';
const GAME_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '44444444-4444-4444-8444-444444444444';

/** Один вызов `$fetch`: путь и параметры, с которыми он ушёл. */
interface FetchCall {
  path: string;
  options: { query?: Record<string, unknown> } | undefined;
}

let calls: Array<FetchCall> = [];

/**
 * Подменяет `$fetch` записывающей заглушкой.
 * @param response Тело, которым отвечает заглушка.
 */
function stubFetch(response: unknown) {
  const fetcher = vi.fn(
    (path: string, options?: { query?: Record<string, unknown> }) => {
      calls.push({ path, options });

      return Promise.resolve(response);
    },
  );

  vi.stubGlobal('$fetch', fetcher);

  return fetcher;
}

/**
 * Настоящий `FetchError` из `ofetch` — разбор отказов опирается на
 * `instanceof`, поэтому подделка объектом здесь ничего бы не проверила.
 * @param statusCode HTTP-статус отказа.
 * @param data Тело ответа сервиса.
 */
function createFetchError(statusCode: number, data?: unknown): FetchError {
  const error = new FetchError(`HTTP ${statusCode}`);

  return Object.assign(error, { statusCode, data });
}

/** Ответ игры — минимальный, лишь бы прошёл разбор. */
function gameResponse() {
  return {
    id: GAME_ID,
    masterId: '55555555-5555-4555-8555-555555555555',
    title: 'Тайная игра',
    system: 'DND_2024',
    description: 'Кампания',
    requirements: 'Требования',
    type: 'ONLINE',
    playersToStart: 3,
    maxPlayers: 5,
    startingLevel: 1,
    crossplayAllowed: false,
    status: 'OPEN',
    durationType: 'CAMPAIGN',
    costType: 'FREE',
    visibility: 'PRIVATE',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  };
}

/** Ответ заявки — минимальный, лишь бы прошёл разбор. */
function registrationResponse() {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    gameId: GAME_ID,
    playerId: '88888888-8888-4888-8888-888888888888',
    status: 'PENDING',
    createdAt: '2026-08-30T10:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z',
  };
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('код приглашения в запросах приватной игры', () => {
  it('уходит вместе с запросом самой игры', async () => {
    stubFetch(gameResponse());

    await fetchGame(GAME_ID, INVITE_CODE);

    expect(calls[0]?.options?.query).toEqual({ inviteCode: INVITE_CODE });
  });

  it('уходит вместе с запросом сессий', async () => {
    stubFetch([]);

    await fetchGameSessions(GAME_ID, INVITE_CODE);

    expect(calls[0]?.path).toContain('/sessions');
    expect(calls[0]?.options?.query).toEqual({ inviteCode: INVITE_CODE });
  });

  it('уходит вместе с подачей заявки', async () => {
    stubFetch(registrationResponse());

    await createGameRegistration(GAME_ID, {}, INVITE_CODE);

    expect(calls[0]?.path).toContain('/registrations');
    expect(calls[0]?.options?.query).toEqual({ inviteCode: INVITE_CODE });
  });

  it('уходит вместе с чтением своей заявки', async () => {
    stubFetch(registrationResponse());

    await fetchOwnGameRegistration(GAME_ID, INVITE_CODE);

    expect(calls[0]?.path).toContain('/registrations/me');
    expect(calls[0]?.options?.query).toEqual({ inviteCode: INVITE_CODE });
  });

  it('у публичной игры параметр не отправляется вовсе', async () => {
    stubFetch(gameResponse());

    await fetchGame(GAME_ID, null);

    expect(calls[0]?.options?.query).toEqual({ inviteCode: undefined });
  });
});

describe('своя заявка', () => {
  it('404 означает «заявки ещё не было», а не ошибку', async () => {
    // Без распознавания 404 страница игры показывала бы ошибку вместо
    // предложения подать заявку.
    vi.stubGlobal(
      '$fetch',
      vi.fn(() => Promise.reject(createFetchError(404))),
    );

    await expect(fetchOwnGameRegistration(GAME_ID, null)).resolves.toBeNull();
  });

  it('остальные отказы пробрасываются как есть', async () => {
    // 403 — это «нет доступа к приватной игре», а не «заявки нет»:
    // проглотить его значило бы показать пустое состояние вместо запрета.
    vi.stubGlobal(
      '$fetch',
      vi.fn(() => Promise.reject(createFetchError(403))),
    );

    await expect(
      fetchOwnGameRegistration(GAME_ID, null),
    ).rejects.toBeInstanceOf(FetchError);
  });
});

describe('разбор отказа сервиса', () => {
  it('читает статус и текст из ProblemDetail', () => {
    const error = createFetchError(409, {
      title: 'Достигнут лимит активных игр',
      detail: 'У мастера уже есть незавершённая игра',
    });

    expect(getFindGameStatus(error)).toBe(409);

    expect(getFindGameErrorMessage(error)).toBe(
      'У мастера уже есть незавершённая игра',
    );
  });
});

describe('адрес SSE-ленты', () => {
  it('общий чат игры', () => {
    expect(getChatStreamUrl({ gameId: GAME_ID, sessionId: null })).toBe(
      `/api/find-game/games/${GAME_ID}/chat/stream`,
    );
  });

  it('чат отдельной сессии', () => {
    expect(getChatStreamUrl({ gameId: GAME_ID, sessionId: SESSION_ID })).toBe(
      `/api/find-game/games/${GAME_ID}/sessions/${SESSION_ID}/chat/stream`,
    );
  });

  it('токен в адрес не попадает — путь свой, cookie доедет сама', () => {
    const url = getChatStreamUrl({ gameId: GAME_ID, sessionId: null });

    expect(url.startsWith('/api/find-game/')).toBe(true);
    expect(url).not.toContain('token');
    expect(url).not.toContain('?');
  });
});

describe('сообщение об ошибке', () => {
  it('без распознанной ошибки отдаёт общий текст', () => {
    expect(getFindGameErrorMessage(new Error('boom'))).toBe(
      'Что-то пошло не так. Попробуйте ещё раз.',
    );
  });

  it('статус неизвестной ошибки не выдумывается', () => {
    expect(getFindGameStatus(new Error('boom'))).toBeUndefined();
  });
});
