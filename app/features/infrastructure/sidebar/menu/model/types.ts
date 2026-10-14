import type { Role } from '~/shared/types';

/** Элемент меню навигации */
export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  roles?: Array<Role>;
  action?: string;
  /** Пункт ведёт на другой сайт */
  external?: boolean;
}

/** Секция меню навигации */
export interface MenuSection {
  label: string;
  items: Array<MenuItem>;
}
