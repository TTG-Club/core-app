import type { FilterGroups } from '~infrastructure/filter';
import type { ListPresentationConfig } from '~infrastructure/list-presentation/model';

import type { ItemLinkResponse } from './link';

import { getGroupItems } from '~infrastructure/filter';

import { ITEM_TYPE_FILTER_KEY } from './constants';
import { buildItemGroupTree } from './grouping';

export type ItemGrouping = 'CATEGORY' | 'NONE';
export type ItemSorting = 'NAME';

/**
 * Собирает подписи типов предметов из фильтров раздела: своего словаря типов
 * раздел не держит, а фильтр отдаёт их полным списком.
 *
 * @param filterGroups группы фильтров раздела «Снаряжение».
 * @returns подписи по значению типа; пустая карта, пока фильтры не загружены.
 */
export function getItemTypeLabels(
  filterGroups: FilterGroups,
): Map<string, string> {
  const typeGroup = filterGroups.find(
    (group) => group.key === ITEM_TYPE_FILTER_KEY,
  );

  if (!typeGroup) {
    return new Map();
  }

  return new Map(
    getGroupItems(typeGroup).map((value) => [String(value.id), value.name]),
  );
}

/**
 * Создаёт конфигурацию представления раздела снаряжения.
 *
 * @param getTypeLabels подписи типов предметов на момент построения групп.
 * @returns конфигурация группировки и сортировки списка.
 */
export function createItemListPresentationConfig(
  getTypeLabels: () => Map<string, string>,
): ListPresentationConfig<ItemLinkResponse, ItemGrouping, ItemSorting> {
  return {
    sectionKey: 'items',
    defaultGrouping: 'CATEGORY',
    defaultSorting: 'NAME',
    groupingOptions: [
      {
        label: 'По категории',
        value: 'CATEGORY',
        apiValue: 'CATEGORY',
        groupSort: () => ({
          mode: 'tree',
          build: (items) => buildItemGroupTree(items, getTypeLabels()),
        }),
      },
      {
        label: 'Без группировки',
        value: 'NONE',
        apiValue: 'NONE',
      },
    ],
    sortingOptions: [
      {
        label: 'По русскому названию',
        value: 'NAME',
        apiValue: 'NAME',
      },
    ],
  };
}
