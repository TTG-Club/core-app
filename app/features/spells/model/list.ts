import type {
  ListPresentationConfig,
  ListPresentationGroup,
} from '~infrastructure/list-presentation/model';

import type { SpellLinkResponse } from './link';

export type SpellGrouping = 'LEVEL' | 'SCHOOL' | 'CLASS' | 'NONE';
export type SpellSorting = 'LEVEL' | 'NAME' | 'ENGLISH';

const SPELL_SCHOOL_CLARIFICATION_PATTERN = /\s+\([^()]+\)$/u;

/**
 * Группирует заклинания по базовой школе, не создавая отдельные группы для её уточнений.
 */
function groupSpellsBySchool(
  spells: Array<SpellLinkResponse>,
): Array<ListPresentationGroup<SpellLinkResponse>> {
  const spellsBySchool = new Map<string, Array<SpellLinkResponse>>();

  spells.forEach((spell) => {
    const school = spell.school.replace(SPELL_SCHOOL_CLARIFICATION_PATTERN, '');

    const schoolSpells = spellsBySchool.get(school) ?? [];

    spellsBySchool.set(school, [...schoolSpells, spell]);
  });

  return Array.from(spellsBySchool, ([key, items]) => ({ key, items }));
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
      groupSort: {
        mode: 'custom',
        compare: groupSpellsBySchool,
      },
    },
    {
      // Группировка по классу рендерится отдельным путём с независимой
      // серверной пагинацией групп (useSpellClassPagination + SpellClassGroups),
      // минуя GroupedList, поэтому здесь не нужны field/groupSort.
      label: 'По классу',
      value: 'CLASS',
      apiValue: 'CLASS',
    },
    {
      label: 'Без группировки',
      value: 'NONE',
      apiValue: 'NONE',
    },
  ],
  sortingOptions: [
    {
      label: 'По уровню',
      value: 'LEVEL',
      apiValue: 'LEVEL',
    },
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
