import type { GameSearchFilter } from '../model';

import { isEqual } from 'es-toolkit';

import {
  countActiveGameFilters,
  createEmptyGameFilter,
  fetchGames,
  GAME_CATALOG_PAGE_SIZE,
  parseCatalogPageFromQuery,
  parseGameFilterFromQuery,
  serializeGameFilterToQuery,
} from '../model';

/**
 * Каталог игр: фильтры и страница живут в адресе, выдача постраничная и
 * приходит с сервера.
 *
 * Адрес — единственный источник истины по фильтрам. За счёт этого ссылка на
 * отфильтрованный каталог делится как есть, а возврат из карточки игры
 * восстанавливает подбор обычной кнопкой «назад», без отдельного хранилища.
 */
export function useGameCatalog() {
  const route = useRoute();
  const router = useRouter();

  const filter = ref<GameSearchFilter>(parseGameFilterFromQuery(route.query));
  const page = ref(parseCatalogPageFromQuery(route.query));

  const activeFilterCount = computed(() =>
    countActiveGameFilters(filter.value),
  );

  const hasActiveFilters = computed(() => activeFilterCount.value > 0);

  const {
    data: gamesPage,
    error,
    status,
    refresh,
  } = useAsyncData(
    'find-game-catalog',
    () => fetchGames(filter.value, page.value, GAME_CATALOG_PAGE_SIZE),
    { watch: [filter, page], deep: false },
  );

  const games = computed(() => gamesPage.value?.content ?? []);
  const totalGames = computed(() => gamesPage.value?.totalElements ?? 0);

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isEmpty = computed(
    () => status.value === 'success' && !games.value.length,
  );

  /**
   * Цикл «адрес → состояние → адрес» разрывается сравнением: в адрес пишем,
   * только если он реально отличается от состояния, а состояние обновляем,
   * только если разобранный адрес отличается от него. Любая из двух сторон,
   * дойдя до совпадения, останавливает обмен — поэтому цикл конечен.
   */
  watch([filter, page], () => {
    const query = serializeGameFilterToQuery(filter.value, page.value);

    if (isEqual(query, route.query)) {
      return;
    }

    // replace, а не push: подбор фильтров не должен засорять историю — иначе
    // «назад» из карточки игры возвращает на промежуточный набор условий.
    router.replace({ query });
  });

  watch(
    () => route.query,
    (query) => {
      const nextFilter = parseGameFilterFromQuery(query);
      const nextPage = parseCatalogPageFromQuery(query);

      if (!isEqual(nextFilter, filter.value)) {
        filter.value = nextFilter;
      }

      if (nextPage !== page.value) {
        page.value = nextPage;
      }
    },
  );

  // Смена условий возвращает на первую страницу: иначе пятая страница нового
  // подбора почти всегда пуста, и каталог выглядит сломанным.
  watch(filter, () => {
    page.value = 0;
  });

  /** Сбрасывает все условия подбора. */
  function resetFilter(): void {
    filter.value = createEmptyGameFilter();
  }

  return {
    filter,
    page,
    games,
    totalGames,
    activeFilterCount,
    hasActiveFilters,

    error,
    status,
    isLoading,
    isEmpty,

    pageSize: GAME_CATALOG_PAGE_SIZE,
    refresh,
    resetFilter,
  };
}
