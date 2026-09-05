import { describe, expect, it } from 'vitest';

import { getFindGameUpstreamPath } from '#server/utils/findGameProxy';

describe('переписывание пути в find-game-api', () => {
  it('свой префикс сайта заменяется версией API сервиса', () => {
    expect(getFindGameUpstreamPath('/api/find-game/games')).toBe(
      '/api/v1/games',
    );
  });

  it('вложенные пути сохраняются целиком', () => {
    expect(
      getFindGameUpstreamPath(
        '/api/find-game/games/game-1/sessions/session-1/registrations/me',
      ),
    ).toBe('/api/v1/games/game-1/sessions/session-1/registrations/me');
  });

  it('query-строка сохраняется без изменений', () => {
    expect(
      getFindGameUpstreamPath(
        '/api/find-game/games?system=DND_2024&page=0&size=12',
      ),
    ).toBe('/api/v1/games?system=DND_2024&page=0&size=12');
  });

  it('код приглашения доезжает до сервиса', () => {
    // Без него приватная игра отвечает 404, как несуществующая.
    expect(
      getFindGameUpstreamPath('/api/find-game/games/game-1?inviteCode=code-1'),
    ).toBe('/api/v1/games/game-1?inviteCode=code-1');
  });

  it('вложенный путь переписывается так же', () => {
    expect(
      getFindGameUpstreamPath('/api/find-game/games/game-1/sessions'),
    ).toBe('/api/v1/games/game-1/sessions');
  });

  it('сам префикс без хвоста тоже обслуживается', () => {
    expect(getFindGameUpstreamPath('/api/find-game')).toBe('/api/v1');
  });
});

describe('ограничение прокси своим префиксом', () => {
  it('чужой путь не обслуживается', () => {
    // Иначе обработчик превратился бы в открытый прокси на весь сервис.
    expect(() => getFindGameUpstreamPath('/api/v2/spells')).toThrow();
    expect(() => getFindGameUpstreamPath('/api/auth/me')).toThrow();
  });

  it('похожий по началу путь не считается своим', () => {
    expect(() =>
      getFindGameUpstreamPath('/api/find-game-secret/games'),
    ).toThrow();
  });

  it('выход за пределы своего префикса через .. не пропускается', () => {
    expect(() =>
      getFindGameUpstreamPath('/api/find-game/../auth/me'),
    ).toThrow();

    expect(() =>
      getFindGameUpstreamPath('/api/find-game/games/../../internal/secret'),
    ).toThrow();
  });

  it('точки внутри сегмента путь не ломают', () => {
    // `..` запрещён как отдельный сегмент, а не как подстрока.
    expect(getFindGameUpstreamPath('/api/find-game/games/a..b')).toBe(
      '/api/v1/games/a..b',
    );
  });
});
