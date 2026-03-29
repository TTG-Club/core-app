import type { SavedFilterGroup, SavedFilterItem } from '../types';

/**
 * Находит соответствующую сохранённую группу по уникальному ключу.
 *
 * Приоритет:
 * 1. Единственное совпадение по ключу — однозначный результат.
 * 2. Множественные совпадения по ключу — disambiguация по имени (key + name).
 * 3. Если disambiguация не дала результата — `undefined`.
 *
 * На имя как на единственный критерий ориентироваться нельзя,
 * т.к. имена могут меняться или дублироваться.
 */
export function findSavedGroup(
  savedGroups: SavedFilterGroup[],
  groupKey: string,
  groupName: string,
): SavedFilterGroup | undefined {
  const sourceAliases = ['source', 'sources', 'book', 'books'];
  const isSourceKey = sourceAliases.includes(groupKey);

  const byKey = savedGroups.filter((entry) =>
    isSourceKey ? sourceAliases.includes(entry.key) : entry.key === groupKey,
  );

  if (byKey.length === 1) {
    return byKey[0];
  }

  if (byKey.length > 1) {
    return byKey.find((entry) => entry.name?.trim() === groupName?.trim());
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
