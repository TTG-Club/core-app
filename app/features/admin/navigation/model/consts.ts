import type { NavigationGroup, NavigationItem } from './types';

import {
  PUBLICATION_ICON,
  PUBLICATION_ROUTE,
  PUBLICATION_TEXT,
} from '~admin/game-publications/model';
import {
  HOME_HERO_ADMIN_NAVIGATION_ICON,
  HOME_HERO_ADMIN_PAGE_TITLE,
  HOME_HERO_ADMIN_ROUTE,
} from '~admin/home-hero/model';
import {
  MAILING_NAVIGATION_ICON,
  MAILING_PAGE_TITLE,
  MAILING_ROUTE,
} from '~admin/mailing/model';
import {
  CODES_ADMIN_ROUTE,
  CODES_NAVIGATION_ICON,
  CODES_PAGE_TITLE,
} from '~admin/subscriptions/model';
import {
  ADMIN_USERS_NAVIGATION_ICON,
  ADMIN_USERS_NAVIGATION_LABEL,
} from '~admin/users/model';
import {
  VTTG_COMPENDIUM_ADMIN_ROUTE,
  VTTG_COMPENDIUM_NAVIGATION_ICON,
  VTTG_COMPENDIUM_PAGE_TITLE,
} from '~admin/vttg-compendium/model';
import {
  ARTICLES_ADMIN_CREATE_ROUTE,
  ARTICLES_ADMIN_ROUTE,
} from '~articles/model';

/** Маршрут главной страницы админ-панели (дашборд со статистикой) */
export const ADMIN_DASHBOARD_ROUTE = '/admin';

const ADMIN_DASHBOARD_ITEM: NavigationItem = {
  label: 'Главная',
  icon: 'tabler:home',
  to: ADMIN_DASHBOARD_ROUTE,
};

const ADMIN_PUBLICATIONS_ITEM: NavigationItem = {
  label: PUBLICATION_TEXT.title,
  icon: PUBLICATION_ICON,
  to: PUBLICATION_ROUTE,
};

const ADMIN_TOKENATOR_ITEM: NavigationItem = {
  label: 'Токенатор',
  icon: 'tabler:photo',
  to: '/admin/tokenator',
};

const ADMIN_PERSONAS_ITEM: NavigationItem = {
  label: 'Персоны',
  icon: 'tabler:users',
  to: '/admin/personas',
};

const ADMIN_USERS_ITEM: NavigationItem = {
  label: ADMIN_USERS_NAVIGATION_LABEL,
  icon: ADMIN_USERS_NAVIGATION_ICON,
  to: '/admin/users',
};

const ADMIN_CODES_ITEM: NavigationItem = {
  label: CODES_PAGE_TITLE,
  icon: CODES_NAVIGATION_ICON,
  to: CODES_ADMIN_ROUTE,
};

const ADMIN_ARTICLES_ITEM: NavigationItem = {
  label: 'Статьи / Новости',
  icon: 'tabler:news',
  to: ARTICLES_ADMIN_ROUTE,
  createRoute: ARTICLES_ADMIN_CREATE_ROUTE,
};

const ADMIN_HOME_HERO_ITEM: NavigationItem = {
  label: HOME_HERO_ADMIN_PAGE_TITLE,
  icon: HOME_HERO_ADMIN_NAVIGATION_ICON,
  to: HOME_HERO_ADMIN_ROUTE,
};

const ADMIN_MAILING_ITEM: NavigationItem = {
  label: MAILING_PAGE_TITLE,
  icon: MAILING_NAVIGATION_ICON,
  to: MAILING_ROUTE,
};

const ADMIN_VTTG_COMPENDIUM_ITEM: NavigationItem = {
  label: VTTG_COMPENDIUM_PAGE_TITLE,
  icon: VTTG_COMPENDIUM_NAVIGATION_ICON,
  to: VTTG_COMPENDIUM_ADMIN_ROUTE,
};

/**
 * Элементы главной навигации админ-панели
 */
export const ADMIN_NAVIGATION_ITEMS: NavigationItem[] = [
  ADMIN_DASHBOARD_ITEM,
  ADMIN_PUBLICATIONS_ITEM,
  ADMIN_TOKENATOR_ITEM,
  ADMIN_PERSONAS_ITEM,
  ADMIN_USERS_ITEM,
  ADMIN_CODES_ITEM,
  ADMIN_ARTICLES_ITEM,
  ADMIN_HOME_HERO_ITEM,
  ADMIN_MAILING_ITEM,
  ADMIN_VTTG_COMPENDIUM_ITEM,
];

/** Группа разделов «Пользователи»: к ней же на дашборде относится выключатель оплаты. */
export const ADMIN_USERS_SECTION_GROUP: NavigationGroup = {
  title: 'Пользователи и подписки',
  icon: 'tabler:users-group',
  items: [ADMIN_USERS_ITEM, ADMIN_CODES_ITEM, ADMIN_MAILING_ITEM],
};

export const ADMIN_CONTENT_SECTION_GROUP: NavigationGroup = {
  title: 'Контент сайта',
  icon: 'tabler:layout-dashboard',
  items: [ADMIN_ARTICLES_ITEM, ADMIN_HOME_HERO_ITEM, ADMIN_PERSONAS_ITEM],
};

export const ADMIN_VTTG_SECTION_GROUP: NavigationGroup = {
  title: 'VTTG',
  icon: 'tabler:device-desktop',
  items: [ADMIN_VTTG_COMPENDIUM_ITEM],
};

export const ADMIN_TOOLS_SECTION_GROUP: NavigationGroup = {
  title: 'Инструменты',
  icon: 'tabler:tool',
  items: [ADMIN_PUBLICATIONS_ITEM, ADMIN_TOKENATOR_ITEM],
};

/**
 * Заголовок админ-панели
 */
export const ADMIN_PANEL_TITLE = 'Админ-панель';

/**
 * Иконка админ-панели
 */
export const ADMIN_PANEL_ICON = 'ttg:menu-filled-workshop';

/**
 * Конфигурация UI админ-панели
 */
export const ADMIN_PANEL_UI_CONFIG = {
  navigationWidth: 'w-64',
  iconSize: 'h-6 w-6',
  headerGap: 'mb-6',
  headerPadding: 'px-2',
  containerPadding: 'p-4',
  navGap: 'gap-1',
} as const;
