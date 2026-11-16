import type { GroupKey, GroupSortComparator } from '~ui/grouped-list';

import type { SpeciesLinkResponse } from './types';

import {
  SPECIES_LIST_GROUPS,
  SPECIES_LIST_UNKNOWN_GROUP_LABEL_PREFIX,
} from './constants';

/**
 * Возвращает место группы видов в порядке вывода. Регистр ключа не важен;
 * неизвестная группа идёт после всех известных.
 *
 * @param groupKey - Ключ группы: метка группы источника
 * @returns Порядковый номер группы
 */
export function getSpeciesGroupOrder(groupKey: GroupKey): number {
  const normalizedKey = String(groupKey).toLowerCase();

  const groupIndex = SPECIES_LIST_GROUPS.findIndex(
    (group) => group.key === normalizedKey,
  );

  return groupIndex === -1 ? SPECIES_LIST_GROUPS.length : groupIndex;
}

/**
 * Возвращает подпись разделителя группы видов. Для неизвестной группы
 * подпись собирается из её ключа.
 *
 * @param groupKey - Ключ группы: метка группы источника
 * @returns Подпись разделителя
 */
export function getSpeciesGroupLabel(groupKey: GroupKey): string {
  const normalizedKey = String(groupKey).toLowerCase();

  const knownGroup = SPECIES_LIST_GROUPS.find(
    (group) => group.key === normalizedKey,
  );

  return (
    knownGroup?.label
    ?? `${SPECIES_LIST_UNKNOWN_GROUP_LABEL_PREFIX}${String(groupKey)}`
  );
}

/**
 * Сравнивает ключи групп видов по порядку вывода.
 *
 * @param firstKey - Ключ первой группы
 * @param secondKey - Ключ второй группы
 * @returns Отрицательное число, если первая группа идёт раньше
 */
export function compareSpeciesGroups(
  firstKey: GroupKey,
  secondKey: GroupKey,
): number {
  return getSpeciesGroupOrder(firstKey) - getSpeciesGroupOrder(secondKey);
}

/** Порядок групп списка видов для `GroupedList`. */
export const SPECIES_LIST_GROUP_SORT: GroupSortComparator = {
  mode: 'comparator',
  compare: compareSpeciesGroups,
};

/**
 * Расставляет виды по группам в порядке вывода, не меняя исходный список.
 * Внутри группы порядок остаётся прежним.
 *
 * @param species - Виды в порядке ответа API
 * @returns Виды в порядке экрана
 */
export function sortSpeciesByGroup(
  species: Array<SpeciesLinkResponse>,
): Array<SpeciesLinkResponse> {
  return species.toSorted(
    (firstSpecies, secondSpecies) =>
      getSpeciesGroupOrder(firstSpecies.source.group.label)
      - getSpeciesGroupOrder(secondSpecies.source.group.label),
  );
}
