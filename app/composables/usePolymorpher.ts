import type { PolymorpherGamesResponse } from '~/shared/types/polymorpher';

export function usePolymorpher() {
  const page = ref(1);
  const size = ref(8);
  const search = ref('');

  const query = computed(() => ({
    page: page.value - 1,
    size: size.value,
    ...(search.value.trim() ? { search: search.value.trim() } : {}),
  }));

  const { data, status, error, refresh } = useFetch<PolymorpherGamesResponse>(
    '/api/polymorpher/games',
    {
      query,
      watch: [query],
      default: () => ({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: size.value,
        page: 0,
      }),
    },
  );

  return {
    games: computed(() => data.value?.content ?? []),
    totalPages: computed(() => data.value?.totalPages ?? 0),
    totalElements: computed(() => data.value?.totalElements ?? 0),
    page,
    size,
    search,
    status,
    error,
    refresh,
  };
}
