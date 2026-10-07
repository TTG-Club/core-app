import type { MenuSection } from './types';

import { Role } from '~/shared/types';
import { RECENT_COMMENTS_ROUTE, RECENT_COMMENTS_TITLE } from '~comments/model';
import {
  FIND_GAME_PROFILE_NAVIGATION_LABEL,
  FIND_GAME_PROFILE_ROUTE,
  GAMES_CATALOG_NAVIGATION_LABEL,
  GAMES_CREATE_NAVIGATION_LABEL,
  GAMES_CREATE_ROUTE,
  GAMES_MY_NAVIGATION_LABEL,
  GAMES_MY_ROUTE,
  GAMES_NAVIGATION_LABEL,
  GAMES_ROUTE,
} from '~find-game/model';
import {
  COOKIE_POLICY_PAGE_TITLE,
  COOKIE_POLICY_ROUTE,
} from '~infrastructure/cookie-consent/model';
import {
  PRIVACY_POLICY_LINK_LABEL,
  PRIVACY_POLICY_ROUTE,
} from '~infrastructure/privacy-policy/model';
import {
  PUBLIC_OFFER_PAGE_TITLE,
  PUBLIC_OFFER_ROUTE,
} from '~infrastructure/public-offer/model';
import {
  USER_AGREEMENT_PAGE_TITLE,
  USER_AGREEMENT_ROUTE,
} from '~infrastructure/user-agreement/model';
import {
  VTTG_LANDING_PATH,
  VTTG_PASSWORD_RESET_PAGE,
  VTTG_PASSWORD_RESET_PATH,
  VTTG_SUBSCRIPTION_NAVIGATION_LABEL,
  VTTG_SUBSCRIPTION_PATH,
} from '~vttg/model';

/** Название сайта в шапке меню */
export const MENU_SITE_TITLE = 'TTG Club';

/** Подпись под названием сайта в шапке меню */
export const MENU_SITE_DESCRIPTION = 'Онлайн справочник по D&D 5e 2024';

/** Пометка раздела, который ещё не открыт */
export const MENU_SOON_LABEL = 'Скоро';

/** Иконка пункта, который ведёт на другой сайт */
export const MENU_EXTERNAL_ICON = 'tabler:external-link';

export const MENU_SECTIONS: Array<MenuSection> = [
  {
    label: 'Персонаж',
    items: [
      {
        href: '/classes',
        label: 'Классы',
        icon: 'tabler:sword',
      },
      {
        href: '/species',
        label: 'Виды',
        icon: 'tabler:users',
      },
      {
        href: '/feats',
        label: 'Черты',
        icon: 'tabler:star',
        disabled: false,
      },
      {
        href: '/backgrounds',
        label: 'Предыстории',
        icon: 'tabler:writing',
        disabled: false,
      },
      {
        href: '/spells',
        label: 'Заклинания',
        icon: 'tabler:sparkles',
      },
    ],
  },
  {
    label: 'Предметы',
    items: [
      {
        href: '/items',
        label: 'Снаряжение',
        icon: 'tabler:backpack',
        disabled: false,
      },
      {
        href: '/magic-items',
        label: 'Магические предметы',
        icon: 'tabler:wand',
        disabled: false,
      },
      {
        href: '/',
        label: 'Бастионы',
        icon: 'tabler:building-castle',
        disabled: true,
      },
    ],
  },
  {
    label: 'Мастерская',
    items: [
      {
        href: '/bestiary',
        label: 'Бестиарий',
        icon: 'tabler:paw',
        disabled: false,
      },
      {
        href: '/glossary',
        label: 'Глоссарий',
        icon: 'tabler:book-2',
        disabled: false,
      },
      {
        href: '/sources',
        label: 'Источники',
        icon: 'tabler:books',
        disabled: false,
      },
    ],
  },
  {
    label: 'Инструменты',
    items: [
      {
        href: '',
        label: 'Создание мультикласса',
        icon: 'tabler:layers-intersect',
        action: 'open-multiclass',
      },
      {
        href: '/tokenator',
        label: 'Токенатор',
        icon: 'tabler:photo-circle',
      },
      {
        href: '/calculators/abilities',
        label: 'Калькулятор характеристик',
        icon: 'tabler:calculator',
      },
      {
        href: '/tools/initiative',
        label: 'Трекер инициативы',
        icon: 'tabler:swords',
      },
      {
        href: '/tools/character-sheet',
        label: 'Лист персонажа',
        icon: 'tabler:id',
      },
    ],
  },
  {
    label: GAMES_NAVIGATION_LABEL,
    items: [
      {
        href: GAMES_ROUTE,
        label: GAMES_CATALOG_NAVIGATION_LABEL,
        icon: 'tabler:users-group',
      },
      {
        href: GAMES_CREATE_ROUTE,
        label: GAMES_CREATE_NAVIGATION_LABEL,
        icon: 'tabler:calendar-plus',
        roles: [Role.USER],
      },
      {
        href: GAMES_MY_ROUTE,
        label: GAMES_MY_NAVIGATION_LABEL,
        icon: 'tabler:calendar-event',
        roles: [Role.USER],
      },
      {
        href: FIND_GAME_PROFILE_ROUTE,
        label: FIND_GAME_PROFILE_NAVIGATION_LABEL,
        icon: 'tabler:user-circle',
        roles: [Role.USER],
      },
    ],
  },
  {
    label: 'Virtual TTG',
    items: [
      {
        href: VTTG_LANDING_PATH,
        label: 'Информация',
        icon: 'tabler:info-circle',
      },
      {
        href: VTTG_PASSWORD_RESET_PATH,
        label: VTTG_PASSWORD_RESET_PAGE.title,
        icon: 'tabler:key',
      },
    ],
  },
  {
    label: 'Полезное',
    items: [
      {
        href: '/news',
        label: 'Новости',
        icon: 'tabler:news',
      },
      {
        href: '/articles',
        label: 'Статьи',
        icon: 'tabler:article',
      },
      {
        href: RECENT_COMMENTS_ROUTE,
        label: RECENT_COMMENTS_TITLE,
        icon: 'tabler:message-circle',
      },
      {
        href: 'https://5e14.ttg.club/',
        external: true,
        label: 'Редакция D&D 2014',
        icon: 'tabler:history',
        disabled: false,
      },
      {
        href: VTTG_SUBSCRIPTION_PATH,
        label: VTTG_SUBSCRIPTION_NAVIGATION_LABEL,
        icon: 'tabler:crown',
      },
      {
        href: '/roadmap',
        label: 'Дорожная карта (только админ)',
        icon: 'tabler:route',
        disabled: false,
        roles: [Role.ADMIN],
      },
    ],
  },
  {
    label: 'Другое',
    items: [
      {
        href: COOKIE_POLICY_ROUTE,
        label: COOKIE_POLICY_PAGE_TITLE,
        icon: 'tabler:cookie',
      },
      {
        href: PRIVACY_POLICY_ROUTE,
        label: PRIVACY_POLICY_LINK_LABEL,
        icon: 'tabler:shield-lock',
      },
      {
        href: USER_AGREEMENT_ROUTE,
        label: USER_AGREEMENT_PAGE_TITLE,
        icon: 'tabler:file-text',
      },
      {
        href: PUBLIC_OFFER_ROUTE,
        label: PUBLIC_OFFER_PAGE_TITLE,
        icon: 'tabler:receipt',
      },
    ],
  },
];

/** Ссылки на социальные сети в меню */
export const MENU_LINKS: Array<{
  url: string;
  icon: string;
}> = [
  {
    url: 'https://vk.com/ttg.club',
    icon: 'ttg:vk',
  },
  {
    url: 'https://discord.gg/JqFKMKRtxv',
    icon: 'ttg:discord',
  },
  {
    url: 'https://t.me/ttgclubnews',
    icon: 'ttg:telegram',
  },
  {
    url: 'https://www.youtube.com/channel/UCpFse6-P2IBXYfkesAxZbfA',
    icon: 'ttg:youtube',
  },
];

/** Ссылки на поддержку проекта */
export const MENU_SUPPORT: Array<{
  url: string;
  icon: string;
  label: string;
}> = [
  {
    url: 'https://boosty.to/dnd5club',
    icon: 'ttg:boosty',
    label: 'TTG Club',
  },
  {
    url: 'https://boosty.to/dnd5eclub',
    icon: 'ttg:boosty',
    label: 'Magistrus',
  },
];
