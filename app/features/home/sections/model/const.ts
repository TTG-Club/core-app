import type { Role } from '~/shared/types';

export const CARD_LINKS: Array<{
  name: string;
  url: string;
  img: string;
  disabled?: boolean;
  roles?: Array<Role>;
}> = [
  {
    name: 'Классы',
    url: '/',
    img: '/s3/home/section-link/classes.webp',
    disabled: true,
  },
  {
    name: 'Виды',
    url: '/species',
    img: '/s3/home/section-link/species.webp',
  },
  {
    name: 'Черты',
    url: '/feats',
    img: '/s3/home/section-link/feats.webp',
  },
  {
    name: 'Предыстории',
    url: '/backgrounds',
    img: '/s3/home/section-link/backgrounds.webp',
  },
  {
    name: 'Заклинания',
    url: '/spells',
    img: '/s3/home/section-link/spells.webp',
  },
  {
    name: 'В разработке',
    url: '/',
    img: '/s3/home/section-link/development.webp',
    disabled: true,
  },
  {
    name: 'Снаряжение',
    url: '/',
    img: '/s3/home/section-link/items.webp',
    disabled: true,
  },
  {
    name: 'Магические предметы',
    url: '/magic-items',
    img: '/s3/home/section-link/magic-items.webp',
  },
  {
    name: 'Бестиарий',
    url: '/bestiary',
    img: '/s3/home/section-link/bestiary.webp',
  },
  {
    name: 'Глоссарий правил',
    url: '/glossary',
    img: '/s3/home/section-link/glossary.webp',
  },
  {
    name: 'В разработке',
    url: '/',
    img: '/s3/home/section-link/development.webp',
    disabled: true,
  },
  {
    name: 'В разработке',
    url: '/',
    img: '/s3/home/section-link/development.webp',
    disabled: true,
  },
];
