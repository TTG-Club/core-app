import { computed } from 'vue';

import { useAsyncData } from '#app';
import { DictionaryService } from '~/shared/api/dictionaries';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function extractLabels(value: unknown): Array<string> {
  if (!Array.isArray(value)) {
    return [];
  }

  const labels: Array<string> = [];

  value.forEach((element) => {
    if (!isRecord(element)) {
      return;
    }

    const label = element.label;

    if (typeof label === 'string') {
      labels.push(label);
    }
  });

  return labels;
}

export function useChallengeRatingGroupOrder() {
  const { data, pending, error } = useAsyncData<Array<string>>(
    'dictionary-challenge-rating-order',
    async () => {
      const options = await DictionaryService.challengeRating();

      return extractLabels(options);
    },
    { deep: false },
  );

  const order = computed((): Set<string> => {
    if (Array.isArray(data.value) && data.value.length) {
      return new Set(data.value);
    }

    return new Set();
  });

  return {
    order,
    pending,
    error,
  };
}
