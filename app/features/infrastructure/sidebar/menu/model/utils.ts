import type { MenuAccessPaths, MenuItem, MenuSection } from './types';

/**
 * Пункты раздела меню с учётом доступа от сервера: закрытые разделы
 * убираются, открытым подставляется адрес из ответа сервера.
 *
 * @param menuItems пункты раздела меню
 * @param accessPaths адреса открытых посетителю разделов
 */
function applyMenuItemsAccess(
  menuItems: MenuItem[],
  accessPaths: MenuAccessPaths,
): MenuItem[] {
  return menuItems.flatMap((menuItem) => {
    if (!menuItem.access) {
      return [menuItem];
    }

    const accessPath = accessPaths[menuItem.access];

    return accessPath ? [{ ...menuItem, href: accessPath }] : [];
  });
}

/**
 * Разделы меню с учётом доступа от сервера.
 *
 * @param menuSections разделы меню
 * @param accessPaths адреса открытых посетителю разделов
 */
export function applyMenuSectionsAccess(
  menuSections: MenuSection[],
  accessPaths: MenuAccessPaths,
): MenuSection[] {
  return menuSections.map((menuSection) => ({
    ...menuSection,
    items: applyMenuItemsAccess(menuSection.items, accessPaths),
  }));
}
