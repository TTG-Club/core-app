import { cloneDeep } from 'lodash-es';

import type { Filter } from '~filter/types';

export async function useFilter(key: string, url: string) {
  const filter = useState<Filter | undefined>(key, () => undefined);

  const { data, status, refresh } = await useAsyncData(key, () =>
    $fetch<Filter>(url),
  );

  const isPending = computed(() => status.value === 'pending');

  function update(payload: Filter | undefined) {
    if (!payload) {
      filter.value = undefined;

      return;
    }

    filter.value = payload;
  }

  watch(
    data,
    (value) => {
      if (!value) {
        filter.value = undefined;

        return;
      }

      filter.value = cloneDeep(data.value);
    },
    {
      immediate: true,
      deep: true,
    },
  );

  return {
    isPending,

    filter,

    refresh,
    update,
  };
}
