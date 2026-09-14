import type { Role } from '~/shared/types';

/**
 * Разделы каталога плиткой на главной. `icon` — опознавательный знак раздела:
 * картинка работает фактурой (обесцвечена и приглушена), а различают плитки
 * именно иконка и подпись, иначе десять фотографий спорят друг с другом.
 */
export const CARD_LINKS: Array<{
  name: string;
  url: string;
  img: string;
  icon: string;
  disabled?: boolean;
  roles?: Array<Role>;
}> = [
  {
    name: 'Классы',
    url: '/classes',
    img: '/s3/home/section-link/classes.webp',
    icon: 'tabler:sword',
  },
  {
    name: 'Виды',
    url: '/species',
    img: '/s3/home/section-link/species.webp',
    icon: 'tabler:users',
  },
  {
    name: 'Черты',
    url: '/feats',
    img: '/s3/home/section-link/feats.webp',
    icon: 'tabler:star',
  },
  {
    name: 'Предыстории',
    url: '/backgrounds',
    img: '/s3/home/section-link/backgrounds.webp',
    icon: 'tabler:writing',
  },
  {
    name: 'Заклинания',
    url: '/spells',
    img: '/s3/home/section-link/spells.webp',
    icon: 'tabler:sparkles',
  },
  {
    name: 'Снаряжение',
    url: '/items',
    img: '/s3/home/section-link/items.webp',
    icon: 'tabler:backpack',
  },
  {
    name: 'Магические предметы',
    url: '/magic-items',
    img: '/s3/home/section-link/magic-items.webp',
    icon: 'tabler:wand',
  },
  {
    name: 'Бестиарий',
    url: '/bestiary',
    img: '/s3/home/section-link/bestiary.webp',
    icon: 'tabler:paw',
  },
  {
    name: 'Глоссарий правил',
    url: '/glossary',
    img: '/s3/home/section-link/glossary.webp',
    icon: 'tabler:book-2',
  },
  {
    name: 'Бастионы',
    url: '/',
    img: '/s3/home/section-link/bastions.webp',
    icon: 'tabler:building-castle',
    disabled: true,
  },
];
