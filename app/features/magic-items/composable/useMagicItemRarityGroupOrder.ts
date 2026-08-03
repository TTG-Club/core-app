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

  // Поиск раздела отдаёт редкость подписью, а не значением справочника —
  // сопоставить её с конкретной редкостью можно только через словарь.
  const labelsByValue = computed<Partial<Record<string, string>>>(() =>
    Object.fromEntries(
      data.value.map((option) => [option.value, option.label]),
    ),
  );

  return {
    order,
    labelsByValue,
    pending,
    error,
  };
}
