import type { ListPresentationConfig } from '~infrastructure/list-presentation/model';

import type { CreatureLinkResponse } from './link';

export type CreatureGrouping = 'CHALLENGE_RATING' | 'TYPE' | 'NONE';
export type CreatureSorting = 'CHALLENGE_RATING' | 'NAME' | 'ENGLISH';

/**
 * Создаёт конфигурацию представления бестиария с актуальным порядком ПО.
 */
export function createBestiaryListPresentationConfig(
  getChallengeRatingOrder: () => Set<string>,
): ListPresentationConfig<
  CreatureLinkResponse,
  CreatureGrouping,
  CreatureSorting
> {
  return {
    sectionKey: 'bestiary',
    defaultGrouping: 'CHALLENGE_RATING',
    defaultSorting: 'CHALLENGE_RATING',
    groupingOptions: [
      {
        label: 'По показателю опасности',
        value: 'CHALLENGE_RATING',
        apiValue: 'CHALLENGE_RATING',
        field: 'challengeRailing',
        separatorLabel: 'Уровень опасности {value}',
        groupSort: () => ({
          mode: 'ordered',
          order: getChallengeRatingOrder(),
          unknown: 'before',
        }),
      },
      {
        label: 'По типу',
        value: 'TYPE',
        apiValue: 'TYPE',
        field: 'type',
      },
      {
        label: 'Без группировки',
        value: 'NONE',
        apiValue: 'NONE',
      },
    ],
    sortingOptions: [
      {
        label: 'По показателю опасности',
        value: 'CHALLENGE_RATING',
        apiValue: 'CHALLENGE_RATING',
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
}
