import type { Game, SpringPage } from '../model';

import {
  fetchMyGames,
  MY_GAMES_OVERVIEW_DATA_KEY,
  MY_GAMES_OVERVIEW_PAGE,
  MY_GAMES_OVERVIEW_SIZE,
} from '../model';

/** Обе половины сводки: ближайшие встречи и игры, которые ждут действия. */
interface MyGamesOverviewPages {
  upcoming: SpringPage<Game>;
  attention: SpringPage<Game>;
}

/**
 * Загружает обе половины сводки разом: на экране они всегда рядом, и порознь
 * колонка дорисовывалась бы по частям.
 */
async function fetchMyGamesOverview(): Promise<MyGamesOverviewPages> {
  const [upcoming, attention] = await Promise.all([
    fetchMyGames(
      MY_GAMES_OVERVIEW_PAGE,
      MY_GAMES_OVERVIEW_SIZE,
      [],
      'UPCOMING',
    ),
    fetchMyGames(
      MY_GAMES_OVERVIEW_PAGE,
      MY_GAMES_OVERVIEW_SIZE,
      [],
      'ATTENTION',
    ),
  ]);

  return { upcoming, attention };
}

/**
 * Сводка своих игр: ближайшие встречи и игры, которые требуют внимания.
 *
 * Ключ данных общий, поэтому колонка «Моих игр» и точка на кнопке «Мои игры»
 * в шапке делят один запрос. Выдача личная и грузится только в браузере.
 */
export function useMyGamesOverview() {
  const {
    data: overviewPages,
    error,
    status,
    refresh,
  } = useAsyncData(MY_GAMES_OVERVIEW_DATA_KEY, fetchMyGamesOverview, {
    server: false,
    deep: false,
  });

  const upcomingGames = computed(
    () => overviewPages.value?.upcoming.content ?? [],
  );

  const upcomingTotal = computed(
    () => overviewPages.value?.upcoming.totalElements ?? 0,
  );

  const attentionGames = computed(
    () => overviewPages.value?.attention.content ?? [],
  );

  const attentionTotal = computed(
    () => overviewPages.value?.attention.totalElements ?? 0,
  );

  const hasAttention = computed(() => attentionTotal.value > 0);

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  return {
    upcomingGames,
    upcomingTotal,
    attentionGames,
    attentionTotal,
    hasAttention,

    error,
    status,
    isLoading,
    refresh,
  };
}
