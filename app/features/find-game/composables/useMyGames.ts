import { fetchMyGames, MY_GAMES_PAGE_SIZE } from '../model';

/**
 * Свои игры мастера: публичные и приватные, в любом статусе.
 *
 * Публичный поиск здесь не годится в принципе — приватные игры в него не
 * попадают, а закрытые мастеру всё равно нужно видеть, поэтому раздел ходит
 * в отдельный защищённый метод сервиса.
 */
export function useMyGames() {
  const page = ref(0);

  const {
    data: gamesPage,
    error,
    status,
    refresh,
  } = useAsyncData(
    'find-game-my-games',
    () => fetchMyGames(page.value, MY_GAMES_PAGE_SIZE),
    { watch: [page], deep: false, server: false },
  );

  const games = computed(() => gamesPage.value?.content ?? []);
  const totalGames = computed(() => gamesPage.value?.totalElements ?? 0);

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isEmpty = computed(
    () => status.value === 'success' && !games.value.length,
  );

  return {
    page,
    games,
    totalGames,

    error,
    status,
    isLoading,
    isEmpty,

    pageSize: MY_GAMES_PAGE_SIZE,
    refresh,
  };
}
