import type { Role } from '~/shared/types';

export const MENU_SECTIONS: Array<{
  label: string;
  icon: string;
  items: Array<{
    label: string;
    href: string;
    disabled?: boolean;
    roles?: Array<Role>;
  }>;
}> = [
  {
    label: 'Персонаж',
    icon: 'menu/filled/character',
    items: [
      {
        href: '/classes',
        label: 'Классы',
      },
      {
        href: '/species',
        label: 'Виды',
      },
      {
        href: '/feats',
        label: 'Черты',
        disabled: false,
      },
      {
        href: '/backgrounds',
        label: 'Предыстории',
        disabled: false,
      },
      {
        href: '/spells',
        label: 'Заклинания',
      },
    ],
  },
  {
    label: 'Предметы',
    icon: 'menu/filled/inventory',
    items: [
      {
        href: '/items',
        label: 'Снаряжение',
        disabled: false,
      },
      {
        href: '/magic-items',
        label: 'Магические предметы',
        disabled: false,
      },
      {
        href: '/',
        label: 'Бастионы',
        disabled: true,
      },
    ],
  },
  {
    label: 'Мастерская',
    icon: 'menu/filled/workshop',
    items: [
      {
        href: '/bestiary',
        label: 'Бестиарий',
        disabled: false,
      },
      {
        href: '/glossary',
        label: 'Глоссарий',
        disabled: false,
      },
      {
        href: '/sources',
        label: 'Источники',
        disabled: false,
      },
    ],
  },
  {
    label: 'Другое',
    icon: 'menu/filled/workshop',
    items: [
      {
        href: '/roadmap',
        label: 'Дорожная карта',
        disabled: false,
      },
      {
        href: 'https://5e14.ttg.club/',
        label: 'Редакция D&D 2014',
        disabled: false,
      },
    ],
  },
];

export const MENU_LINKS: Array<{
  url: string;
  icon: string;
}> = [
  {
    url: 'https://vk.com/ttg.club',
    icon: 'i-ttg-vk',
  },
  {
    url: 'https://discord.gg/JqFKMKRtxv',
    icon: 'i-ttg-discord',
  },
  {
    url: 'https://t.me/ttgclubnews',
    icon: 'i-ttg-telegram',
  },
  {
    url: 'https://www.youtube.com/channel/UCpFse6-P2IBXYfkesAxZbfA',
    icon: 'i-ttg-youtube',
  },
];

export const MENU_SUPPORT: Array<{
  url: string;
  icon: string;
  label: string;
}> = [
  {
    url: 'https://boosty.to/dnd5club',
    icon: 'i-ttg-boosty',
    label: 'TTG Club',
  },
  {
    url: 'https://boosty.to/dnd5eclub',
    icon: 'i-ttg-boosty',
    label: 'Magistrus',
  },
];
