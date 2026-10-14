import { describe, expect, it } from 'vitest';

import { getVttgModulesUpstreamPath } from '#server/utils/vttgModulesProxy';

describe('переписывание пути в реестр модулей VTTG', () => {
  it('свой префикс сайта заменяется версией API сервиса', () => {
    expect(getVttgModulesUpstreamPath('/api/vttg-modules/submissions/my')).toBe(
      '/api/v1/submissions/my',
    );
  });

  it('query-строка очереди модерации сохраняется', () => {
    expect(
      getVttgModulesUpstreamPath(
        '/api/vttg-modules/moderation/submissions?status=PENDING&page=0&size=20',
      ),
    ).toBe('/api/v1/moderation/submissions?status=PENDING&page=0&size=20');
  });
});

describe('ограничение прокси реестра своим префиксом', () => {
  it('чужой и похожий по началу путь не обслуживаются', () => {
    expect(() => getVttgModulesUpstreamPath('/api/find-game/games')).toThrow();

    expect(() =>
      getVttgModulesUpstreamPath('/api/vttg-modules-secret/submissions'),
    ).toThrow();
  });

  it('выход за пределы префикса через .. не пропускается', () => {
    expect(() =>
      getVttgModulesUpstreamPath('/api/vttg-modules/../auth/me'),
    ).toThrow();
  });
});
