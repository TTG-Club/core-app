import type { NavigationItem } from './types';

import {
  ADMIN_USERS_NAVIGATION_ICON,
  ADMIN_USERS_NAVIGATION_LABEL,
} from '~admin/users/model';

/**
 * Элементы главной навигации админ-панели
 */
export const ADMIN_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Главная',
    icon: 'tabler:home',
    to: '/admin',
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
