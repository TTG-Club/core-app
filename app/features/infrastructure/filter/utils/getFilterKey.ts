/**
 * Формирует ключ для `useState` фильтра, добавляя префикс `filter-` при необходимости
 */
export function getFilterKey(key: string): string {
  if (!key) {
    throw new Error('Filter key is empty');
  }

  return key.startsWith('filter-') ? key : `filter-${key}`;
}
