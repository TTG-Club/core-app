import type {
  FilterGroup,
  FilterGroups,
  FilterItem,
  FilterItems,
} from '../types';

import { getGroupItems } from './getGroupItems';
import { getSelectedItemIds } from './selection';

/**
 * Возвращает идентификаторы выбранных значений указанной группы.
 *
 * Родитель в режиме «Исключать» (`mode`) не сужает доступность детей: его выбор
 * означает исключение результатов, а не whitelist. Поэтому такой родитель
 * трактуется как отсутствие ограничения (пустой набор) — иначе доступность
 * дочерних значений была бы инвертирована.
 */
function getSelectedIds(groups: FilterGroups, groupKey: string): Set<string> {
  const sourceGroup = groups.find((group) => group.key === groupKey);

  if (!sourceGroup || sourceGroup.mode) {
    return new Set<string>();
  }

  return new Set(getSelectedItemIds(sourceGroup));
}

/**
 * Проверяет доступность значения с учётом выбранных значений родительских групп.
 * Пустой (или исключающий) родительский фильтр не ограничивает дочерние значения.
 */
function isItemAvailable(
  relations: FilterItem['relations'],
  resolveSelectedIds: (parentKey: string) => Set<string>,
): boolean {
  if (!relations) {
    return true;
  }

  return Object.entries(relations).every(([parentKey, relatedIds]) => {
    const selectedParentIds = resolveSelectedIds(parentKey);

    return (
      selectedParentIds.size === 0
      || relatedIds.some((relatedId) =>
        selectedParentIds.has(String(relatedId)),
      )
    );
  });
}

/** Возвращает доступные значения группы согласно связям `relations`. */
export function getAvailableGroupItems(
  group: FilterGroup,
  groups: FilterGroups,
): FilterItems {
  // Набор выбранных id для родительского ключа вычисляется один раз на вызов
  // и переиспользуется для всех элементов группы (без пересчёта на каждый item).
  const selectedIdsByParent = new Map<string, Set<string>>();

  const resolveSelectedIds = (parentKey: string): Set<string> => {
    const cached = selectedIdsByParent.get(parentKey);

    if (cached) {
      return cached;
    }

    const selectedIds = getSelectedIds(groups, parentKey);

    selectedIdsByParent.set(parentKey, selectedIds);

    return selectedIds;
  };

  return getGroupItems(group).filter((filterItem) =>
    isItemAvailable(filterItem.relations, resolveSelectedIds),
  );
}

/** Определяет, зависит ли дочерняя группа от родительской группы. */
export function isGroupDependentOn(
  childGroup: FilterGroup,
  parentKey: string,
): boolean {
  return getGroupItems(childGroup).some(
    (filterItem) => filterItem.relations?.[parentKey] !== undefined,
  );
}

/**
 * Приводит выбор одной группы к её доступным значениям без мутации оригинала.
 * Недоступные значения теряют выбор; чекбоксы «Исключать»/«AND» сбрасываются
 * только если каскад реально снял выбор группы (а не просто она пуста).
 */
function normalizeGroup(
  group: FilterGroup,
  contextGroups: FilterGroups,
): FilterGroup {
  const availableIds = new Set(
    getAvailableGroupItems(group, contextGroups).map((filterItem) =>
      String(filterItem.id),
    ),
  );

  const values = getGroupItems(group).map((filterItem) => ({
    ...filterItem,
    selected: availableIds.has(String(filterItem.id))
      ? filterItem.selected
      : null,
  }));

  const hadSelection = getGroupItems(group).some(
    (filterItem) => filterItem.selected,
  );

  const hasSelection = values.some((filterItem) => filterItem.selected);
  const wasClearedByCascade = hadSelection && !hasSelection;

  return {
    ...group,
    values,
    mode: wasClearedByCascade ? false : group.mode,
    union: wasClearedByCascade ? false : group.union,
  };
}

/**
 * Сбрасывает выбранные значения, ставшие недоступными после изменения родителей.
 *
 * Группы обрабатываются по порядку: контекст доступности для каждой группы
 * собирается из уже нормализованных предыдущих групп и исходных последующих.
 * Это распространяет многоуровневый каскад (дед → родитель → ребёнок) за один
 * проход, но опирается на инвариант контракта API: РОДИТЕЛЬСКАЯ группа идёт в
 * массиве раньше дочерней.
 *
 * Функция идемпотентна: повторный вызов на собственном результате ничего не
 * меняет. Именно это гарантирует завершение watcher-цикла в `useFilter`.
 */
export function normalizeDependentSelections(
  groups: FilterGroups,
): FilterGroups {
  const normalizedGroups: FilterGroups = [];

  groups.forEach((group, index) => {
    const contextGroups = [...normalizedGroups, ...groups.slice(index)];

    normalizedGroups.push(normalizeGroup(group, contextGroups));
  });

  return normalizedGroups;
}
