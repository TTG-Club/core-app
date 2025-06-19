import { Role } from '~/shared/types';

export const MENU_SECTIONS = [
  {
    label: 'Персонаж',
    icon: 'menu/filled/character',
    items: [
      {
        href: '/',
        label: 'Классы',
        disabled: true,
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
        href: '/',
        label: 'Снаряжение',
        disabled: true,
      },
      {
        href: '/magic-items',
        label: 'Магические предметы',
        disabled: false,
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
        roles: [Role.ADMIN],
      },
      {
        href: '/glossary',
        label: 'Глоссарий',
        disabled: false,
      },
      {
        href: '/',
        label: 'Источники',
        disabled: true,
      },
    ],
  },
  {
    label: 'Инструкции',
    icon: 'menu/filled/wiki',
    items: [
      {
        href: '/',
        label: 'Discord Bot',
        disabled: true,
      },
      {
        href: '/',
        label: 'Telegram Spell Bot',
        disabled: true,
      },
      {
        href: '/',
        label: 'Управление закладками',
        disabled: true,
      },
    ],
  },
];

export const MENU_LINKS = [
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

export const MENU_SUPPORT = [
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
