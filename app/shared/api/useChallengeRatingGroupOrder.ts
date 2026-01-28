import { computed } from 'vue';

import { DictionaryService } from '~/shared/api/dictionaries';
import type { ChallengeRatingSelectOption } from '~/shared/types';

export function useChallengeRatingGroupOrder() {
  const { data, pending, error } = useAsyncData<
    Array<ChallengeRatingSelectOption>
  >('dictionary-challenge-rating', () => DictionaryService.challengeRating(), {
    deep: false,
    default: (): Array<ChallengeRatingSelectOption> => [],
  });

  const order = computed(() => {
    return data.value.map((option) => option.label);
  });

  return {
    order,
    pending,
    error,
  };
}
