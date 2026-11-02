import type { FilterGroups } from '../types';

import { normalizeDependentSelections } from './filterDependencies';
import { getGroupItems } from './getGroupItems';

/** Плашка выбранного значения фильтра над списком. */
export interface ActiveFilterChip {
  /** Ключ группы, которой принадлежит значение */
  groupKey: string;
  /** Идентификатор значения в группе */
  itemId: string;
  /** Подпись плашки: «Группа: значение» */
  label: string;
  /** Группа работает на исключение — плашка отмечается как исключение */
  isExcluded: boolean;
}

/**
 * Собирает плашки всех выбранных значений фильтра в порядке групп.
 *
 * @param groups Группы фильтров раздела.
 * @returns Плашки выбранных значений; пусто — ничего не выбрано.
 */
export function getActiveFilterChips(
  groups: FilterGroups,
): Array<ActiveFilterChip> {
  return groups.flatMap((group) =>
    getGroupItems(group)
      .filter((filterItem) => filterItem.selected)
      .map((filterItem) => ({
        groupKey: group.key,
        itemId: String(filterItem.id),
        label: `${group.name}: ${filterItem.name}`,
        isExcluded: !!group.mode,
      })),
  );
}

/**
 * Снимает одно выбранное значение и прогоняет каскад зависимых групп: значения,
 * доступные только при снятом, тоже снимаются.
 *
 * @param groups Группы фильтров раздела.
 * @param chip Снимаемая плашка.
 * @returns Новые группы фильтров.
 */
export function removeActiveFilterChip(
  groups: FilterGroups,
  chip: Pick<ActiveFilterChip, 'groupKey' | 'itemId'>,
): FilterGroups {
  const updatedGroups = groups.map((group) => {
    if (group.key !== chip.groupKey) {
      return group;
    }

    return {
      ...group,
      values: getGroupItems(group).map((filterItem) =>
        String(filterItem.id) === chip.itemId
          ? { ...filterItem, selected: null }
          : filterItem,
      ),
    };
  });

  return normalizeDependentSelections(updatedGroups);
}
