import type { NavigationItem } from './types';

/**
 * Элементы главной навигации админ-панели
 */
export const ADMIN_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Главная',
    icon: 'i-heroicons-home',
    to: '/admin-panel',
  },
  {
    label: 'Токенатор',
    icon: 'i-heroicons-photo',
    to: '/admin-panel/tokenator',
  },
];

/**
 * Заголовок админ-панели
 */
export const ADMIN_PANEL_TITLE = 'Админ-панель';

/**
 * Иконка админ-панели
 */
export const ADMIN_PANEL_ICON = 'i-ttg-menu-filled-workshop';

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
