import type { MenuSection } from '~infrastructure/sidebar/menu/model/types';

import { describe, expect, it } from 'vitest';

import { getVttgDocsVisibleChannels } from '#shared/utils';
// Сам файл, а не barrel: константы меню тянут модели всех разделов сайта.
import { applyMenuSectionsAccess } from '~infrastructure/sidebar/menu/model/utils';

const PUBLIC_SETTINGS = {
  isReleaseChannelPublic: true,
  releaseChannelRoles: [],
  devChannelRoles: ['TESTER'],
};

const PRIVATE_SETTINGS = {
  isReleaseChannelPublic: false,
  releaseChannelRoles: ['USER'],
  devChannelRoles: ['TESTER'],
};

const MENU_SECTIONS: MenuSection[] = [
  {
    label: 'Virtual TTG',
    items: [
      { label: 'Информация', href: '/vttg', icon: 'tabler:info-circle' },
      {
        label: 'Документация',
        href: '/vttg/docs',
        icon: 'tabler:book-2',
        access: 'vttg-docs',
      },
    ],
  },
];

describe('кому видны каналы документации VTTG', () => {
  it('администратор видит оба канала при любой настройке', () => {
    expect(getVttgDocsVisibleChannels([], true, PRIVATE_SETTINGS)).toEqual([
      'release',
      'dev',
    ]);
  });

  it('открытый всем релиз видит гость, канал разработки — только его роли', () => {
    expect(getVttgDocsVisibleChannels([], false, PUBLIC_SETTINGS)).toEqual([
      'release',
    ]);

    expect(
      getVttgDocsVisibleChannels(['TESTER'], false, PUBLIC_SETTINGS),
    ).toEqual(['release', 'dev']);
  });

  it('закрытый релиз видят только его роли', () => {
    expect(getVttgDocsVisibleChannels([], false, PRIVATE_SETTINGS)).toEqual([]);

    expect(
      getVttgDocsVisibleChannels(['USER'], false, PRIVATE_SETTINGS),
    ).toEqual(['release']);

    expect(
      getVttgDocsVisibleChannels(['TESTER'], false, PRIVATE_SETTINGS),
    ).toEqual(['dev']);
  });
});

describe('пункт «Документация» в меню сайта', () => {
  it('закрытый раздел из меню убирается', () => {
    const [virtualTtgSection] = applyMenuSectionsAccess(MENU_SECTIONS, {});

    expect(virtualTtgSection?.items).toHaveLength(1);
  });

  it('открытый раздел ведёт в первый открытый канал', () => {
    const [virtualTtgSection] = applyMenuSectionsAccess(MENU_SECTIONS, {
      'vttg-docs': '/vttg/docs?channel=dev',
    });

    expect(virtualTtgSection?.items[1]?.href).toBe('/vttg/docs?channel=dev');
  });
});
