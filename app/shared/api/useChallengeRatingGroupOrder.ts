import { computed } from 'vue';
import { DictionaryService } from '~/shared/api/dictionaries';
import type { SelectOption } from '~/shared/types';

export function useChallengeRatingGroupOrder() {
  const { data, pending, error } = useAsyncData<Array<SelectOption>>(
    'dictionary-challenge-rating',
    async () => {
      return await DictionaryService.challengeRating();
    },
    {
      deep: false,
      default: (): Array<SelectOption> => [],
    },
  );

  const order = computed<Array<string>>(() => {
    return data.value.map((option) => option.label);
  });

  return {
    order,
    pending,
    error,
  };
}
