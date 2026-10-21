import type { FilterGroup, FilterGroups } from '~infrastructure/filter';

import { describe, expect, it } from 'vitest';

import {
  getAvailableGroupItems,
  hasRequiredRelations,
  normalizeDependentSelections,
} from '~infrastructure/filter';

const COMPONENT_KEY = 'component';

/** Группа компонентов с отмеченными значениями. */
function createComponentGroup(
  selectedIds: Array<string>,
  mode = false,
): FilterGroup {
  return {
    key: COMPONENT_KEY,
    name: 'Компоненты',
    type: 'filter',
    mode,
    values: ['VERBAL', 'SOMATIC', 'MATERIAL'].map((id) => ({
      id,
      value: id,
      name: id,
      selected: selectedIds.includes(id) ? true : null,
    })),
  };
}

/** Группа свойств материального компонента, зависящая от «Материального». */
function createMaterialGroup(selectedIds: Array<string> = []): FilterGroup {
  return {
    key: 'material',
    name: 'Материальный компонент',
    type: 'filter',
    values: ['WITH_COST', 'CONSUMABLE'].map((id) => ({
      id,
      value: id,
      name: id,
      selected: selectedIds.includes(id) ? true : null,
      relations: { [COMPONENT_KEY]: ['MATERIAL'] },
      relationsRequired: true,
    })),
  };
}

/** Доступные id группы свойств при заданной группе компонентов. */
function getMaterialIds(componentGroup: FilterGroup): Array<string> {
  const materialGroup = createMaterialGroup();
  const groups: FilterGroups = [componentGroup, materialGroup];

  return getAvailableGroupItems(materialGroup, groups).map((filterItem) =>
    String(filterItem.id),
  );
}

describe('обязательные связи фильтров', () => {
  it('скрывает значения, пока в родителе ничего не выбрано', () => {
    expect(getMaterialIds(createComponentGroup([]))).toEqual([]);
  });

  it('скрывает значения, если выбран не связанный компонент', () => {
    expect(getMaterialIds(createComponentGroup(['VERBAL']))).toEqual([]);
  });

  it('показывает значения при выборе связанного компонента', () => {
    expect(getMaterialIds(createComponentGroup(['MATERIAL']))).toEqual([
      'WITH_COST',
      'CONSUMABLE',
    ]);
  });

  it('скрывает значения, если связанный компонент исключён', () => {
    expect(getMaterialIds(createComponentGroup(['MATERIAL'], true))).toEqual(
      [],
    );
  });

  it('снимает выбор свойств, когда «Материальный» снят', () => {
    const [, materialGroup] = normalizeDependentSelections([
      createComponentGroup([]),
      createMaterialGroup(['CONSUMABLE']),
    ]);

    expect(
      materialGroup?.values?.some((filterItem) => filterItem.selected),
    ).toBe(false);
  });

  it('распознаёт группу с обязательными связями', () => {
    expect(hasRequiredRelations(createMaterialGroup())).toBe(true);
    expect(hasRequiredRelations(createComponentGroup([]))).toBe(false);
  });
});
