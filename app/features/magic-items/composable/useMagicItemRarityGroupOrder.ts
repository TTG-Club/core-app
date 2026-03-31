import type { SelectOption } from '~/shared/types';

import { computed } from 'vue';

import { DictionaryService } from '~/shared/api/dictionaries';

export function useMagicItemRarityGroupOrder() {
  const { data, pending, error } = useAsyncData(
    'dictionary-rarity',
    () => DictionaryService.rarity(),
    {
      deep: false,
      default: (): Array<SelectOption> => [],
    },
  );

  const order = computed<Set<string>>(
    () => new Set(data.value.map((option) => option.label)),
  );

  return {
    order,
    pending,
    error,
  };
}
