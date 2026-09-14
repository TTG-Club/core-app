import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addFavoriteGame,
  countActiveGameFilters,
  createEmptyGameFilter,
  fetchFavoriteGames,
  parseFavoriteGames,
  parseGameFilterFromQuery,
  removeFavoriteGame,
  serializeGameFilterToQuery,
  toGameSearchQuery,
} from '~find-game/model';

const GAME_ID = '11111111-1111-4111-8111-111111111111';

/** Один вызов `$fetch`: путь и метод, с которыми он ушёл. */
interface FetchCall {
  path: string;
  method: string | undefined;
}

let calls: Array<FetchCall> = [];

/**
 * Подменяет `$fetch` записывающей заглушкой.
 * @param response Тело, которым отвечает заглушка.
 */
function stubFetch(response: unknown) {
  vi.stubGlobal(
    '$fetch',
    vi.fn((path: string, options?: { method?: string }) => {
      calls.push({ path, method: options?.method });

      return Promise.resolve(response);
    }),
  );
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('разбор отметок игр', () => {
  const favorite = {
    gameId: GAME_ID,
    createdAt: '2026-09-01T10:00:00Z',
  };

  it('читает отметку целиком', () => {
    const parsed = parseFavoriteGames([favorite]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.gameId).toBe(GAME_ID);
    expect(parsed[0]?.createdAt).toBe(favorite.createdAt);
  });

  it('битую запись выбрасывает поштучно', () => {
    // Одна испорченная строка не должна прятать весь список: отметка без
    // идентификатора игры не показывает ничью звёздочку.
    const parsed = parseFavoriteGames([
      favorite,
      { createdAt: '2026-09-01T10:00:00Z' },
    ]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.gameId).toBe(GAME_ID);
  });

  it('не список читает пустым', () => {
    expect(parseFavoriteGames(null)).toEqual([]);
  });
});

describe('запросы избранного', () => {
  it('отметка и снятие идут по одному пути разными методами', async () => {
    stubFetch(null);

    await addFavoriteGame(GAME_ID);
    await removeFavoriteGame(GAME_ID);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.path).toBe(`/api/find-game/games/${GAME_ID}/favorite`);
    expect(calls[0]?.method).toBe('PUT');
    expect(calls[1]?.path).toBe(calls[0]?.path);
    expect(calls[1]?.method).toBe('DELETE');
  });

  it('список отметок разбирается, битые записи отсеиваются', async () => {
    stubFetch([
      { gameId: GAME_ID, createdAt: '2026-09-01T10:00:00Z' },
      { createdAt: '2026-09-01T10:00:00Z' },
    ]);

    const favorites = await fetchFavoriteGames();

    expect(calls[0]?.path).toBe('/api/find-game/profiles/me/favorites/games');
    expect(favorites).toHaveLength(1);
    expect(favorites[0]?.gameId).toBe(GAME_ID);
  });
});

describe('отбор каталога по избранному', () => {
  it('выключенный переключатель в адрес не попадает', () => {
    const filter = createEmptyGameFilter();

    expect(filter.favorite).toBe(false);
    expect(serializeGameFilterToQuery(filter, 0)).toEqual({});
    expect(countActiveGameFilters(filter)).toBe(0);
  });

  it('включённый переживает дорогу в адрес и обратно', () => {
    const filter = { ...createEmptyGameFilter(), favorite: true };
    const query = serializeGameFilterToQuery(filter, 0);

    expect(query).toEqual({ favorite: 'true' });
    expect(countActiveGameFilters(filter)).toBe(1);
    expect(parseGameFilterFromQuery({ favorite: 'true' })).toEqual(filter);
  });

  it('чужое значение в адресе отбор не включает', () => {
    // Каталог должен открыться по любой ссылке: неразобранное условие просто
    // считается не заданным.
    expect(parseGameFilterFromQuery({ favorite: 'yes' }).favorite).toBe(false);
    expect(parseGameFilterFromQuery({ favorite: '' }).favorite).toBe(false);
  });

  it('условие уходит в сервис вместе с пагинацией', () => {
    const query = toGameSearchQuery(
      { ...createEmptyGameFilter(), favorite: true },
      2,
      20,
    );

    expect(query).toEqual({ favorite: 'true', page: 2, size: 20 });
  });
});
