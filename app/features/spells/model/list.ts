import type { ListPresentationConfig } from '~infrastructure/list-presentation/model';

import type { SpellLinkResponse } from './link';

export type SpellGrouping = 'LEVEL' | 'SCHOOL' | 'CLASS' | 'NONE';
export type SpellSorting = 'LEVEL' | 'NAME' | 'ENGLISH';

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
