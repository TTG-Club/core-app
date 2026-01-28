import { computed } from 'vue';

import { DictionaryService } from '~/shared/api/dictionaries';
import type { ChallengeRatingSelectOption } from '~/shared/types';

export function useChallengeRatingGroupOrder() {
  const { data, pending, error } = useAsyncData<
    Array<ChallengeRatingSelectOption>
  >(
    'dictionary-challenge-rating',
    async () => {
      return await DictionaryService.challengeRating();
    },
    {
      deep: false,
      default: (): Array<ChallengeRatingSelectOption> => [],
    },
  );

  const challengeRatingOptions = computed<Array<ChallengeRatingSelectOption>>(
    () => {
      const loadedOptions = data.value;

      if (Array.isArray(loadedOptions)) {
        return loadedOptions;
      }

      return [];
    },
  );

  const order = computed<Array<number>>(() => {
    return challengeRatingOptions.value.map(
      (option: ChallengeRatingSelectOption) => {
        return option.value;
      },
    );
  });

  return {
    order,
    pending,
    error,
  };
}
