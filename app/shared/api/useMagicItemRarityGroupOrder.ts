import { computed } from 'vue';
import { DictionaryService } from '~/shared/api/dictionaries';
import type { SelectOption } from '~/shared/types';

export function useMagicItemRarityGroupOrder() {
  const { data, pending, error } = useAsyncData(
    'dictionary-rarity',
    () => DictionaryService.rarity(),
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
