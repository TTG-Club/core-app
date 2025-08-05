import type { GlobalSearchRes } from '~/features/search/model/types';
import { GlobalSearch } from '../../command-palette';

export const useGlobalSearch = async () => {
  const searchTerm = ref('');

  const overlay = useOverlay();

  const modal = overlay.create(GlobalSearch);

  const isOpen = computed(() => overlay.isOpen(modal.id));

  function open() {
    if (isOpen.value) {
      return;
    }

    modal.open();
  }

  function close() {
    modal.close();
  }

  const { data, execute, status } = await useAsyncData<GlobalSearchRes>(
    'full-text-search',
    () =>
      $fetch('/api/v2/full-text-search', {
        params: { query: searchTerm.value },
      }),
    { server: false, immediate: false, watch: [searchTerm] },
  );

  const loading = computed(() => status.value === 'pending');

  watchDebounced(searchTerm, async () => await execute(), { debounce: 700 });

  return { isOpen, searchTerm, data, close, open, loading };
};
