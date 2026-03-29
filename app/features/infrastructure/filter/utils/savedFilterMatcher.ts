import type { SavedFilterGroup, SavedFilterItem } from '../types';

/**
 * Находит соответствующую сохранённую группу по ключу и имени.
 * Приоритет: точное совпадение по имени → единственная группа с таким ключом.
 */
export function findSavedGroup(
  savedGroups: SavedFilterGroup[],
  groupKey: string,
  groupName: string,
): SavedFilterGroup | undefined {
  const exactByName = savedGroups.find(
    (entry) => entry.name?.trim() === groupName?.trim(),
  );

  if (exactByName) {
    return exactByName;
  }

  const sourceAliases = ['source', 'sources', 'book', 'books'];
  const isSourceKey = sourceAliases.includes(groupKey);

  const byKey = savedGroups.filter((entry) =>
    isSourceKey ? sourceAliases.includes(entry.key) : entry.key === groupKey,
  );

  if (byKey.length === 1) {
    return byKey[0];
  }

  return undefined;
}

/**
 * Определяет, выбран ли элемент в сохранённом фильтре
 */
export function resolveItemSelection(
  item: { id: string | number; value: string; name: string },
  savedGroup: SavedFilterGroup | undefined,
  isLoggedIn: boolean,
): boolean | null {
  if (!isLoggedIn || !savedGroup) {
    return null;
  }

  const savedItem = savedGroup.filters.find((entry: SavedFilterItem) => {
    const entryVal = String(entry.value).toLowerCase();

    return (
      entryVal === String(item.value).toLowerCase()
      || entryVal === String(item.id).toLowerCase()
    );
  });

  return savedItem && savedItem.selected === true ? true : null;
}
