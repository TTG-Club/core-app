import type { Role } from '~/shared/types';

/** Элемент меню навигации */
export interface MenuItem {
  label: string;
  href: string;
  disabled?: boolean;
  roles?: Array<Role>;
  action?: string;
}

/** Секция меню навигации */
export interface MenuSection {
  label: string;
  icon: string;
  items: Array<MenuItem>;
}
