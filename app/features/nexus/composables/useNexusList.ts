import { fetchNexuses, NEXUS_PAGE_SIZE } from '../model';

/**
 * Комнаты пользователя: свои и те, куда позвали ссылкой.
 *
 * Комнат игр в списке нет — в них ходят со страницы игры, и здесь они
 * смешались бы с теми, куда позвали лично.
 */
export function useNexusList() {
  const page = ref(0);

  const {
    data: nexusPage,
    error,
    status,
    refresh,
  } = useAsyncData('nexus-list', () => fetchNexuses(page.value), {
    watch: [page],
    deep: false,
    server: false,
  });

  const nexuses = computed(() => nexusPage.value?.content ?? []);
  const totalNexuses = computed(() => nexusPage.value?.totalElements ?? 0);

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isEmpty = computed(
    () => status.value === 'success' && !nexuses.value.length,
  );

  return {
    page,
    nexuses,
    totalNexuses,

    error,
    status,
    isLoading,
    isEmpty,

    pageSize: NEXUS_PAGE_SIZE,
    refresh,
  };
}
