import type { NavigationItem } from './types';

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
  ADMIN_USERS_NAVIGATION_ICON,
  ADMIN_USERS_NAVIGATION_LABEL,
} from '~admin/users/model';
import {
  VTTG_COMPENDIUM_ADMIN_ROUTE,
  VTTG_COMPENDIUM_NAVIGATION_ICON,
  VTTG_COMPENDIUM_PAGE_TITLE,
} from '~admin/vttg-compendium/model';
import { ARTICLES_ADMIN_ROUTE } from '~articles/model';

/** Маршрут главной страницы админ-панели (дашборд со статистикой) */
export const ADMIN_DASHBOARD_ROUTE = '/admin';

/**
 * Элементы главной навигации админ-панели
 */
export const ADMIN_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Главная',
    icon: 'tabler:home',
    to: ADMIN_DASHBOARD_ROUTE,
  },
  {
    label: PUBLICATION_TEXT.title,
    icon: PUBLICATION_ICON,
    to: PUBLICATION_ROUTE,
  },
  {
    label: 'Токенатор',
    icon: 'tabler:photo',
    to: '/admin/tokenator',
  },
  {
    label: 'Персоны',
    icon: 'tabler:users',
    to: '/admin/personas',
  },
  {
    label: ADMIN_USERS_NAVIGATION_LABEL,
    icon: ADMIN_USERS_NAVIGATION_ICON,
    to: '/admin/users',
  },
  {
    label: 'Статьи / Новости',
    icon: 'tabler:news',
    to: ARTICLES_ADMIN_ROUTE,
  },
  {
    label: HOME_HERO_ADMIN_PAGE_TITLE,
    icon: HOME_HERO_ADMIN_NAVIGATION_ICON,
    to: HOME_HERO_ADMIN_ROUTE,
  },
  {
    label: MAILING_PAGE_TITLE,
    icon: MAILING_NAVIGATION_ICON,
    to: MAILING_ROUTE,
  },
  {
    label: VTTG_COMPENDIUM_PAGE_TITLE,
    icon: VTTG_COMPENDIUM_NAVIGATION_ICON,
    to: VTTG_COMPENDIUM_ADMIN_ROUTE,
  },
];

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
