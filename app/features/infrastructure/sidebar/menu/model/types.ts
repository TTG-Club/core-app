import type { Role } from '~/shared/types';

/**
 * Доступ, который сайт спрашивает у сервера: раздел открыт не всем, и
 * настраивается это в админке, а не ролью в коде.
 */
export type MenuItemAccess = 'vttg-docs';

/** Адреса разделов с доступом от сервера; нет адреса — раздел закрыт. */
export type MenuAccessPaths = Partial<Record<MenuItemAccess, string>>;

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
  /**
   * `href` — путь на сайте другой редакции (D&D 2014); origin подставляется
   * из `runtimeConfig.public.oldSiteUrl`, чтобы dev вёл на dev, а прод — на прод.
   */
  legacySite?: boolean;
  /** Пункт выделен золотой рамкой и цветом */
  highlighted?: boolean;
  /**
   * Пункт виден, только если сервер открыл посетителю раздел; адрес тогда
   * берётся из ответа сервера, а `href` — запасной.
   */
  access?: MenuItemAccess;
}

/** Секция меню навигации */
export interface MenuSection {
  label: string;
  items: Array<MenuItem>;
}
