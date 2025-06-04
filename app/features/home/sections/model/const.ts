import { Role } from '~/shared/types';

export const CARD_LINKS = [
  {
    name: 'Классы',
    url: '/',
    img: '/s3/sections/home-link/button_classes.webp',
    disabled: true,
  },
  {
    name: 'Виды',
    url: '/species',
    img: '/s3/sections/home-link/button_races.webp',
  },
  {
    name: 'Черты',
    url: '/feats',
    img: '/s3/sections/home-link/button_traits.webp',
  },
  {
    name: 'Предыстории',
    url: '/backgrounds',
    img: '/s3/sections/home-link/button_backgrounds.webp',
  },
  {
    name: 'Заклинания',
    url: '/spells',
    img: '/s3/sections/home-link/button_spells.webp',
  },
  {
    name: 'В разработке',
    url: '/',
    img: '/s3/sections/home-link/button_development.webp',
    disabled: true,
  },
  {
    name: 'Снаряжение',
    url: '/',
    img: '/s3/sections/home-link/button_items.webp',
    disabled: true,
  },
  {
    name: 'Магические предметы',
    url: '/magic-items',
    img: '/s3/sections/home-link/button_items_magic.webp',
  },
  {
    name: 'Бестиарий',
    url: '/bestiary',
    img: '/s3/sections/home-link/button_bestiary.webp',
    roles: [Role.ADMIN],
  },
  {
    name: 'Глоссарий правил',
    url: '/glossary',
    img: '/s3/sections/home-link/button_screens.webp',
  },
  {
    name: 'В разработке',
    url: '/',
    img: '/s3/sections/home-link/button_development.webp',
    disabled: true,
  },
  {
    name: 'В разработке',
    url: '/',
    img: '/s3/sections/home-link/button_development.webp',
    disabled: true,
  },
];
