import type { GameStatus } from '../model';

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

  /**
   * Отбор по статусу; пусто — все, кроме отменённых. Отменённая игра не
   * состоялась, и в общем списке она только мешает — но найтись должна.
   */
  const statuses = ref<Array<GameStatus>>([]);

  const {
    data: gamesPage,
    error,
    status,
    refresh,
  } = useAsyncData(
    () => `find-game-my-games-${statuses.value.join(',')}`,
    () => fetchMyGames(page.value, MY_GAMES_PAGE_SIZE, statuses.value),
    { watch: [page, statuses], deep: false, server: false },
  );

  // Смена отбора возвращает к первой странице: на третьей странице прежней
  // выдачи новый отбор показал бы пустоту.
  watch(statuses, () => {
    page.value = 0;
  });

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
    statuses,
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
