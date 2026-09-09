import type { MaybeRefOrGetter } from 'vue';

import type { GamePersonalRole, GameStatus } from '../model';

import { fetchMyGames, MY_GAMES_PAGE_SIZE } from '../model';

/**
 * Игры пользователя с серверным отбором по роли и статусу.
 *
 * Публичный поиск здесь не годится в принципе — приватные игры в него не
 * попадают, а закрытые мастеру всё равно нужно видеть, поэтому раздел ходит
 * в отдельный защищённый метод сервиса.
 */
export function useMyGames(role: MaybeRefOrGetter<GamePersonalRole> = 'ALL') {
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
    () =>
      `find-game-my-games-${toValue(role)}-${page.value}-${statuses.value.join(',')}`,
    () =>
      fetchMyGames(
        page.value,
        MY_GAMES_PAGE_SIZE,
        statuses.value,
        toValue(role),
      ),
    { deep: false, server: false },
  );

  // Смена отбора возвращает к первой странице: на третьей странице прежней
  // выдачи новый отбор показал бы пустоту.
  //
  // `flush: 'sync'`: страница обнуляется в тот же тик, что и отбор, — иначе
  // запрос успевал уйти со старым номером страницы, а следом сразу второй.
  watch(
    [statuses, () => toValue(role)],
    () => {
      page.value = 0;
    },
    { flush: 'sync' },
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
