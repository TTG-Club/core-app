import { computed } from 'vue';

import { DictionaryService } from '~/shared/api/dictionaries';

import { useAsyncData } from '#app';

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
    () => {
      return DictionaryService.challengeRating().then((options) => {
        return extractLabels(options);
      });
    },
    { deep: false },
  );

  const order = computed((): Array<string> => {
    const loadedOrder = data.value;

    if (Array.isArray(loadedOrder)) {
      return loadedOrder;
    }

    return [];
  });

  return {
    order,
    pending,
    error,
  };
}
