import type { Role } from '~/shared/types';

/** Элемент меню навигации */
export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  /** Пункт видят только обладатели роли */
  roles?: Array<Role>;
  /** Пункт видят все, но открыт он только обладателям роли */
  enabledRoles?: Array<Role>;
  action?: string;
  /** Пункт ведёт на другой сайт */
  external?: boolean;
  /** Пункт выделен золотой рамкой и цветом */
  highlighted?: boolean;
}

/** Секция меню навигации */
export interface MenuSection {
  label: string;
  items: Array<MenuItem>;
}
