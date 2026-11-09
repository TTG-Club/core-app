import type { FilterGroups } from '~infrastructure/filter';

import { describe, expect, it } from 'vitest';

import {
  getActiveFilterChips,
  removeActiveFilterChip,
} from '~infrastructure/filter';

/**
 * Две группы: круг заклинания и школа; во второй включено исключение.
 */
function createGroups(): FilterGroups {
  return [
    {
      key: 'level',
      name: 'Круг',
      type: 'filter',
      values: [
        { id: 1, value: '1', name: '1', selected: true },
        { id: 3, value: '3', name: '3', selected: true },
        { id: 5, value: '5', name: '5', selected: null },
      ],
    },
    {
      key: 'school',
      name: 'Школа',
      type: 'filter',
      mode: true,
      values: [
        {
          id: 'EVOCATION',
          value: 'EVOCATION',
          name: 'Воплощение',
          selected: true,
        },
        { id: 'ILLUSION', value: 'ILLUSION', name: 'Иллюзия', selected: false },
      ],
    },
  ];
}

describe('getActiveFilterChips', () => {
  it('собирает выбранные значения по порядку групп', () => {
    expect(getActiveFilterChips(createGroups())).toEqual([
      { groupKey: 'level', itemId: '1', label: 'Круг: 1', isExcluded: false },
      { groupKey: 'level', itemId: '3', label: 'Круг: 3', isExcluded: false },
      {
        groupKey: 'school',
        itemId: 'EVOCATION',
        label: 'Школа: Воплощение',
        isExcluded: true,
      },
    ]);
  });

  it('пустой выбор — нет плашек', () => {
    expect(
      getActiveFilterChips([
        { key: 'level', name: 'Круг', type: 'filter', values: [] },
      ]),
    ).toEqual([]);
  });
});

describe('removeActiveFilterChip', () => {
  it('снимает только выбранное значение и не меняет исходные группы', () => {
    const groups = createGroups();

    const result = removeActiveFilterChip(groups, {
      groupKey: 'level',
      itemId: '3',
    });

    expect(result[0]?.values?.map((filterItem) => filterItem.selected)).toEqual(
      [true, null, null],
    );

    expect(result[1]).toEqual(groups[1]);
    expect(groups[0]?.values?.[1]?.selected).toBe(true);
  });
});
