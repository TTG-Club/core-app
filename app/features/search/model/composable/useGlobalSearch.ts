import type { GlobalSearchRes } from '~/features/search/model/types';
import { watchDebounced } from '@vueuse/core';

export const useGlobalSearch = () => {
  const isOpen = useState('isGlobalSearchOpen', () => false);
  const searchTerm = ref('');
  const data = ref<GlobalSearchRes>();
  const loading = ref(false);

  const open = () => {
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  watchDebounced(
    searchTerm,
    async (q) => {
      if (!q) {
        data.value = undefined;

        return;
      }

      loading.value = true;

      try {
        const { data: res } = await useAsyncData<GlobalSearchRes>(
          `full-text-search-${q}`,
          () =>
            $fetch('/api/v2/full-text-search', {
              params: { query: q },
            }),
        );

        data.value = res.value;
      } finally {
        loading.value = false;
      }
    },
    { debounce: 400 },
  );

  return { isOpen, searchTerm, data, close, open, loading };
};
