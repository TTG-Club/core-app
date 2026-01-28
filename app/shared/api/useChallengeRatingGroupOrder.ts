// ~/shared/api/useChallengeRatingGroupOrder.ts
import { computed } from 'vue';
import { DictionaryService } from '~/shared/api/dictionaries';
import type { ChallengeRatingSelectOption } from '~/shared/types';

const loadChallengeRatingDictionary = (): Promise<
  Array<ChallengeRatingSelectOption>
> => {
  return DictionaryService.challengeRating();
};

export function useChallengeRatingGroupOrder() {
  const { data, pending, error } = useAsyncData(
    'dictionary-challenge-rating',
    loadChallengeRatingDictionary,
    {
      deep: false,
      default: (): Array<ChallengeRatingSelectOption> => [],
    },
  );

  const order = computed((): Array<string> => {
    return data.value.map((option) => option.label);
  });

  return {
    order,
    pending,
    error,
  };
}
