import { describe, expect, it } from 'vitest';

// Сам файл, а не barrel: сервис рядом опирается на авто-импорты Nitro.
import {
  getCatalogCacheKey,
  isCatalogCacheReset,
} from '#server/domain/catalog-cache/utils/catalogCachePath';

describe('getCatalogCacheKey', () => {
  it('кэширует чтение записи, списка и фильтров раздела', () => {
    expect(getCatalogCacheKey('GET', '/api/v2/bestiary/goblin')).toBe(
      '/api/v2/bestiary/goblin',
    );

    expect(getCatalogCacheKey('GET', '/api/v2/spells/search')).toBe(
      '/api/v2/spells/search',
    );

    expect(getCatalogCacheKey('GET', '/api/v2/dictionaries/sizes')).toBe(
      '/api/v2/dictionaries/sizes',
    );
  });

  it('сводит один запрос с разным порядком параметров к одному ключу', () => {
    expect(
      getCatalogCacheKey('GET', '/api/v2/spells/search?size=20&page=0'),
    ).toBe(getCatalogCacheKey('GET', '/api/v2/spells/search?page=0&size=20'));
  });

  it('различает запросы с разными параметрами', () => {
    expect(getCatalogCacheKey('GET', '/api/v2/spells/search?page=0')).not.toBe(
      getCatalogCacheKey('GET', '/api/v2/spells/search?page=1'),
    );
  });

  it('не кэширует форму редактора', () => {
    expect(getCatalogCacheKey('GET', '/api/v2/bestiary/goblin/raw')).toBe(
      undefined,
    );
  });

  it('не кэширует запросы не на чтение', () => {
    expect(getCatalogCacheKey('HEAD', '/api/v2/bestiary/goblin')).toBe(
      undefined,
    );

    expect(getCatalogCacheKey('POST', '/api/v2/source/search')).toBe(undefined);
  });

  it('не кэширует разделы, ответ которых зависит от посетителя', () => {
    expect(getCatalogCacheKey('GET', '/api/v2/notification')).toBe(undefined);

    expect(getCatalogCacheKey('GET', '/api/v2/player-bastions')).toBe(
      undefined,
    );

    expect(getCatalogCacheKey('GET', '/api/v2/tools/character-sheet')).toBe(
      undefined,
    );

    expect(getCatalogCacheKey('GET', '/api/auth/me')).toBe(undefined);
  });
});

describe('isCatalogCacheReset', () => {
  it('сбрасывает кэш при создании, правке и удалении записи', () => {
    expect(isCatalogCacheReset('POST', '/api/v2/bestiary')).toBe(true);
    expect(isCatalogCacheReset('PUT', '/api/v2/bestiary/goblin')).toBe(true);
    expect(isCatalogCacheReset('DELETE', '/api/v2/spells/fireball')).toBe(true);
  });

  it('сбрасывает кэш при откате записи и ручном сбросе', () => {
    expect(
      isCatalogCacheReset('POST', '/api/v2/revisions/SPELL/12/revert/3'),
    ).toBe(true);

    expect(isCatalogCacheReset('GET', '/api/v2/cache/evict-all')).toBe(true);
  });

  it('не сбрасывает кэш при чтении, предпросмотре и поиске', () => {
    expect(isCatalogCacheReset('GET', '/api/v2/bestiary/goblin')).toBe(false);
    expect(isCatalogCacheReset('HEAD', '/api/v2/bestiary/goblin')).toBe(false);
    expect(isCatalogCacheReset('POST', '/api/v2/bestiary/preview')).toBe(false);
    expect(isCatalogCacheReset('POST', '/api/v2/source/search')).toBe(false);
  });

  it('не сбрасывает кэш при записи вне каталога', () => {
    expect(isCatalogCacheReset('POST', '/api/v2/online/heartbeat')).toBe(false);
    expect(isCatalogCacheReset('POST', '/api/v2/rating')).toBe(false);
    expect(isCatalogCacheReset('PUT', '/api/v2/player-bastions/1')).toBe(false);
  });
});
