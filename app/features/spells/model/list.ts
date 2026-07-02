import type { ListPresentationConfig } from '~infrastructure/list-presentation/model';

import type { SpellLinkResponse } from './link';

export type SpellGrouping = 'LEVEL' | 'SCHOOL' | 'CLASS' | 'NONE';
export type SpellSorting = 'NAME' | 'ENGLISH';

export interface SpellListGroup {
  key: string;
  items: Array<SpellLinkResponse>;
}

/**
 * Группирует заклинания по всем доступным классам. Заклинание нескольких
 * классов присутствует в каждой соответствующей группе.
 */
export function groupSpellsByClass(
  spells: Array<SpellLinkResponse>,
): Array<SpellListGroup> {
  const groups = new Map<string, Array<SpellLinkResponse>>();

  spells.forEach((spell) => {
    const classNames = spell.classes.length
      ? spell.classes.map((characterClass) => characterClass.name)
      : ['Без класса'];

    classNames.forEach((className) => {
      const classSpells = groups.get(className) ?? [];

      groups.set(className, [...classSpells, spell]);
    });
  });

  return Array.from(groups.entries())
    .sort(([firstName], [secondName]) => sortString(firstName, secondName))
    .map(([key, items]) => ({ key, items }));
}

/**
 * Возвращает подпись группы уровня заклинаний.
 */
function getSpellLevelLabel(level: number | string): string {
  if (typeof level === 'string') {
    return level;
  }

  return !level ? 'Заговоры' : `Уровень ${level}`;
}

export const SPELL_LIST_PRESENTATION_CONFIG: ListPresentationConfig<
  SpellLinkResponse,
  SpellGrouping,
  SpellSorting
> = {
  sectionKey: 'spells',
  defaultGrouping: 'LEVEL',
  defaultSorting: 'NAME',
  groupingOptions: [
    {
      label: 'По уровню',
      value: 'LEVEL',
      apiValue: 'LEVEL',
      field: 'level',
      separatorLabel: getSpellLevelLabel,
    },
    {
      label: 'По школе',
      value: 'SCHOOL',
      apiValue: 'SCHOOL',
      field: 'school',
    },
    {
      label: 'По классу',
      value: 'CLASS',
      apiValue: 'CLASS',
      field: 'classes',
      groupSort: { mode: 'custom', compare: groupSpellsByClass },
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
    {
      label: 'По английскому названию',
      value: 'ENGLISH',
      apiValue: 'ENGLISH',
    },
  ],
};
