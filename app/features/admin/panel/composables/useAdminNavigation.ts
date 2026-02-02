import { ADMIN_NAVIGATION_ITEMS } from '../model';

import type { NavigationItem } from '../model';

/**
 * Composable для управления навигацией админ-панели.
 * Предоставляет список элементов навигации и методы для работы с ними.
 *
 * @returns Элементы навигации и вспомогательные методы
 */
export function useAdminNavigation() {
  const route = useRoute();

  /**
   * Список навигационных элементов
   */
  const items = computed(() => ADMIN_NAVIGATION_ITEMS);

  /**
   * Проверяет активность навигационного элемента
   *
   * @param item - Элемент навигации
   * @returns true если элемент соответствует текущему роуту
   */
  function isItemActive(item: NavigationItem): boolean {
    return route.path === item.to || route.path.startsWith(`${item.to}/`);
  }

  /**
   * Определяет цвет кнопки на основе активности
   *
   * @param item - Элемент навигации
   * @returns Цвет для UButton component
   */
  function getItemColor(item: NavigationItem): 'primary' | 'neutral' {
    return isItemActive(item) ? 'primary' : 'neutral';
  }

  /**
   * Определяет вариант кнопки на основе активности
   *
   * @param item - Элемент навигации
   * @returns Вариант для UButton component
   */
  function getItemVariant(item: NavigationItem): 'soft' | 'ghost' {
    return isItemActive(item) ? 'soft' : 'ghost';
  }

  return {
    items,
    isItemActive,
    getItemColor,
    getItemVariant,
  };
}
