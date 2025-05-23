import { cloneDeep } from 'lodash-es';

import type { Filter } from '../types';

export async function useFilter(key: string, url: string) {
  const filter = useState<Filter | undefined>(key, () => undefined);

  const { data, status, refresh } = await useAsyncData(
    key,
    () => $fetch<Filter>(url),
    {
      deep: false,
    },
  );

  const isPending = computed(() => status.value === 'pending');

  const isShowedPreview = computed(() =>
    filter.value?.groups.some((group) =>
      group.filters.some((item) => item.selected !== null),
    ),
  );

  function getClone(
    payload: MaybeRefOrGetter<Filter | undefined>,
  ): Filter | undefined {
    const _payload = toValue(payload);

    if (!_payload) {
      return undefined;
    }

    return cloneDeep(_payload);
  }

  watch(
    data,
    (value) => {
      filter.value = getClone(value);
    },
    {
      immediate: true,
      deep: true,
    },
  );

  return {
    isPending,
    isShowedPreview,

    filter,

    refresh,
  };
}
