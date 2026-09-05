import type { NavigationItem } from './types';

import {
  MAILING_NAVIGATION_ICON,
  MAILING_PAGE_TITLE,
  MAILING_ROUTE,
} from '~admin/mailing/model';
import {
  ADMIN_USERS_NAVIGATION_ICON,
  ADMIN_USERS_NAVIGATION_LABEL,
} from '~admin/users/model';
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
    label: MAILING_PAGE_TITLE,
    icon: MAILING_NAVIGATION_ICON,
    to: MAILING_ROUTE,
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
