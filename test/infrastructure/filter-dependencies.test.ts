import type { FilterGroup } from '~infrastructure/filter';

import { describe, expect, it } from 'vitest';

import {
  getAvailableGroupItems,
  normalizeDependentSelections,
} from '~infrastructure/filter';

const COMPONENT_KEY = 'component';

const MATERIAL_PROPERTY_IDS = ['WITH_COST', 'CONSUMABLE'];

/**
 * Группа компонентов: «С ценой» и «Расходуемый» связаны с «Материальным»
 * той же группы и доступны только при его выборе.
 */
function createComponentGroup(
  selectedIds: Array<string>,
  mode = false,
): FilterGroup {
  return {
    key: COMPONENT_KEY,
    name: 'Компоненты',
    type: 'filter',
    mode,
    values: ['VERBAL', 'SOMATIC', 'MATERIAL', ...MATERIAL_PROPERTY_IDS].map(
      (id) => ({
        id,
        value: id,
        name: id,
        selected: selectedIds.includes(id) ? true : null,
        ...(MATERIAL_PROPERTY_IDS.includes(id)
          ? {
              relations: { [COMPONENT_KEY]: ['MATERIAL'] },
              relationsRequired: true,
            }
          : {}),
      }),
    ),
  };
}

/** Доступные id группы компонентов. */
function getAvailableIds(componentGroup: FilterGroup): Array<string> {
  return getAvailableGroupItems(componentGroup, [componentGroup]).map(
    (filterItem) => String(filterItem.id),
  );
}

describe('обязательные связи фильтров', () => {
  it('скрывает уточнения, пока «Материальный» не выбран', () => {
    expect(getAvailableIds(createComponentGroup([]))).toEqual([
      'VERBAL',
      'SOMATIC',
      'MATERIAL',
    ]);

    expect(getAvailableIds(createComponentGroup(['VERBAL']))).toEqual([
      'VERBAL',
      'SOMATIC',
      'MATERIAL',
    ]);
  });

  it('показывает уточнения при выборе «Материального»', () => {
    expect(getAvailableIds(createComponentGroup(['MATERIAL']))).toEqual([
      'VERBAL',
      'SOMATIC',
      'MATERIAL',
      'WITH_COST',
      'CONSUMABLE',
    ]);
  });

  it('скрывает уточнения в режиме исключения', () => {
    expect(
      getAvailableIds(createComponentGroup(['MATERIAL'], true)),
    ).not.toContain('CONSUMABLE');
  });

  it('снимает уточнения, когда «Материальный» снят', () => {
    const [componentGroup] = normalizeDependentSelections([
      createComponentGroup(['VERBAL', 'CONSUMABLE']),
    ]);

    const selectedIds = componentGroup?.values
      ?.filter((filterItem) => filterItem.selected)
      .map((filterItem) => filterItem.id);

    expect(selectedIds).toEqual(['VERBAL']);
  });
});
