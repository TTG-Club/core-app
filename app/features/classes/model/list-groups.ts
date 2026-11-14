import type { GroupKey, GroupSortComparator } from '~ui/grouped-list';

import type { ClassLinkResponse } from './link';

import {
  CLASS_LIST_GROUPS,
  CLASS_LIST_UNKNOWN_GROUP_LABEL_PREFIX,
} from './constants';

/**
 * Возвращает место группы классов в порядке вывода. Регистр ключа не важен;
 * неизвестная группа идёт после всех известных.
 *
 * @param groupKey - Ключ группы: метка группы источника
 * @returns Порядковый номер группы
 */
export function getClassGroupOrder(groupKey: GroupKey): number {
  const normalizedKey = String(groupKey).toLowerCase();

  const groupIndex = CLASS_LIST_GROUPS.findIndex(
    (group) => group.key === normalizedKey,
  );

  return groupIndex === -1 ? CLASS_LIST_GROUPS.length : groupIndex;
}

/**
 * Возвращает подпись разделителя группы классов. Для неизвестной группы
 * подпись собирается из её ключа.
 *
 * @param groupKey - Ключ группы: метка группы источника
 * @returns Подпись разделителя
 */
export function getClassGroupLabel(groupKey: GroupKey): string {
  const normalizedKey = String(groupKey).toLowerCase();

  const knownGroup = CLASS_LIST_GROUPS.find(
    (group) => group.key === normalizedKey,
  );

  return (
    knownGroup?.label
    ?? `${CLASS_LIST_UNKNOWN_GROUP_LABEL_PREFIX}${String(groupKey)}`
  );
}

/**
 * Сравнивает ключи групп классов по порядку вывода.
 *
 * @param firstKey - Ключ первой группы
 * @param secondKey - Ключ второй группы
 * @returns Отрицательное число, если первая группа идёт раньше
 */
export function compareClassGroups(
  firstKey: GroupKey,
  secondKey: GroupKey,
): number {
  return getClassGroupOrder(firstKey) - getClassGroupOrder(secondKey);
}

/** Порядок групп списка классов для `GroupedList`. */
export const CLASS_LIST_GROUP_SORT: GroupSortComparator = {
  mode: 'comparator',
  compare: compareClassGroups,
};

/**
 * Расставляет классы по группам в порядке вывода, не меняя исходный список.
 * Внутри группы порядок остаётся прежним.
 *
 * @param classes - Классы в порядке ответа API
 * @returns Классы в порядке экрана
 */
export function sortClassesByGroup(
  classes: Array<ClassLinkResponse>,
): Array<ClassLinkResponse> {
  return classes.toSorted(
    (firstClass, secondClass) =>
      getClassGroupOrder(firstClass.source.group.label)
      - getClassGroupOrder(secondClass.source.group.label),
  );
}
