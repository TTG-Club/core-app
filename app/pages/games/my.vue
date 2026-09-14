<script setup lang="ts">
  import type { GamePersonalRole } from '~find-game/model';

  import { Role } from '~/shared/types';
  import {
    GameCard,
    GameCardSkeleton,
    GamesHeaderActions,
    MyGamesOverview,
  } from '~find-game/catalog';
  import {
    useHumanPage,
    useMyGames,
    useParticipantNames,
  } from '~find-game/composables';
  import {
    BookmarkedPlayersPanel,
    FollowedMastersPanel,
  } from '~find-game/follows';
  import {
    BOOKMARKED_PLAYERS_TAB_LABEL,
    CATALOG_RETRY_LABEL,
    FAVORITE_GAMES_EMPTY_DESCRIPTION,
    FAVORITE_GAMES_EMPTY_TITLE,
    FAVORITE_GAMES_TAB_LABEL,
    FOLLOWED_MASTERS_TAB_LABEL,
    GAME_CATALOG_SKELETON_COUNT,
    GAME_STATUS_LABELS,
    GAME_STATUSES,
    GAMES_CREATE_NAVIGATION_LABEL,
    GAMES_CREATE_ROUTE,
    GAMES_MY_NAVIGATION_LABEL,
    GAMES_NAVIGATION_LABEL,
    GAMES_ROUTE,
    getFindGameErrorMessage,
    getGamesFoundLabel,
    MY_GAMES_ALL_LABEL,
    MY_GAMES_APPLICATIONS_LABEL,
    MY_GAMES_EMPTY_DESCRIPTION,
    MY_GAMES_EMPTY_TITLE,
    MY_GAMES_ERROR_TITLE,
    MY_GAMES_GRID_COLUMNS,
    MY_GAMES_HOSTING_LABEL,
    MY_GAMES_PLAYING_LABEL,
    MY_GAMES_STATUS_ALL_LABEL,
    MY_GAMES_STATUS_ALL_VALUE,
    MY_GAMES_STATUS_HINT,
    MY_GAMES_TABS,
  } from '~find-game/model';
  import { PageBackdrop, PageGrid } from '~ui/page';
  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  useSeoMeta({
    title: GAMES_MY_NAVIGATION_LABEL,
  });

  const route = useRoute();
  const router = useRouter();

  const tab = computed({
    get: () =>
      Object.values(MY_GAMES_TABS).find(
        (section) => section === route.query.tab,
      ) ?? MY_GAMES_TABS.ALL,
    set: (value: string) => {
      void router.replace({ query: { ...route.query, tab: value } });
    },
  });

  const personalRole = computed<GamePersonalRole>(() => {
    if (tab.value === MY_GAMES_TABS.PLAYING) {
      return 'PLAYER';
    }

    if (tab.value === MY_GAMES_TABS.HOSTING) {
      return 'MASTER';
    }

    if (tab.value === MY_GAMES_TABS.APPLICATIONS) {
      return 'APPLICATIONS';
    }

    if (tab.value === MY_GAMES_TABS.FAVORITES) {
      return 'FAVORITE';
    }

    return 'ALL';
  });

  const {
    error,
    games,
    isEmpty,
    isLoading,
    page,
    pageSize,
    refresh,
    status,
    statuses,
    totalGames,
  } = useMyGames(personalRole);

  /**
   * Ряд отбора: «Активные» — всё, кроме отменённых, дальше по одному
   * состоянию. Отменённые лежат за отдельным вариантом: они не состоялись, и в
   * общем списке только мешают — об этом говорит описание «Активных».
   */
  const statusItems = computed(() => [
    {
      label: MY_GAMES_STATUS_ALL_LABEL,
      value: MY_GAMES_STATUS_ALL_VALUE,
      description: MY_GAMES_STATUS_HINT,
    },
    ...GAME_STATUSES.map((value) => ({
      label: GAME_STATUS_LABELS[value],
      value,
    })),
  ]);

  const pickedStatus = computed({
    get: () => statuses.value[0] ?? MY_GAMES_STATUS_ALL_VALUE,
    set: (value: string) => {
      const picked = GAME_STATUSES.find((status) => status === value);

      statuses.value = picked ? [picked] : [];
    },
  });

  const humanPage = useHumanPage(page);

  const isError = computed(() => status.value === 'error');

  const isFavoritesTab = computed(() => tab.value === MY_GAMES_TABS.FAVORITES);

  const isGameList = computed(
    () =>
      tab.value !== MY_GAMES_TABS.MASTERS
      && tab.value !== MY_GAMES_TABS.PLAYERS,
  );

  /**
   * Счётчик найденного — как в каталоге. У списков отметок своя выдача без
   * счётчика, и там его нет.
   */
  const foundLabel = computed(() =>
    !isGameList.value || isLoading.value || isError.value || !totalGames.value
      ? null
      : getGamesFoundLabel(totalGames.value),
  );

  /**
   * Пустая вкладка избранного говорит о себе сама: отложенных игр просто ещё
   * не набралось, и совет создать свою игру здесь не к месту — в отличие от
   * пустых «Играю» и «Веду».
   */
  const emptyTitle = computed(() =>
    isFavoritesTab.value ? FAVORITE_GAMES_EMPTY_TITLE : MY_GAMES_EMPTY_TITLE,
  );

  const emptyDescription = computed(() =>
    isFavoritesTab.value
      ? FAVORITE_GAMES_EMPTY_DESCRIPTION
      : MY_GAMES_EMPTY_DESCRIPTION,
  );

  /**
   * Разделы: все свои игры, их срезы, избранное и два списка отметок. Отметки
   * живут здесь, а не в профиле: игрока отмечают, чтобы позвать в игру, а
   * мастера — чтобы не пропустить его новую.
   */
  const tabItems = [
    {
      value: MY_GAMES_TABS.ALL,
      label: MY_GAMES_ALL_LABEL,
      icon: 'tabler:layout-grid',
    },
    {
      value: MY_GAMES_TABS.PLAYING,
      label: MY_GAMES_PLAYING_LABEL,
      icon: 'tabler:users',
    },
    {
      value: MY_GAMES_TABS.HOSTING,
      label: MY_GAMES_HOSTING_LABEL,
      icon: 'tabler:cards',
    },
    {
      value: MY_GAMES_TABS.APPLICATIONS,
      label: MY_GAMES_APPLICATIONS_LABEL,
      icon: 'tabler:send',
    },
    {
      value: MY_GAMES_TABS.FAVORITES,
      label: FAVORITE_GAMES_TAB_LABEL,
      icon: 'tabler:star',
    },
    {
      value: MY_GAMES_TABS.MASTERS,
      label: FOLLOWED_MASTERS_TAB_LABEL,
      icon: 'tabler:bookmark',
    },
    {
      value: MY_GAMES_TABS.PLAYERS,
      label: BOOKMARKED_PLAYERS_TAB_LABEL,
      icon: 'tabler:user-check',
    },
  ];

  const selectedSectionIcon = computed(
    () => tabItems.find((section) => section.value === tab.value)?.icon,
  );

  const { getParticipantName, watchParticipantNames } = useParticipantNames();

  // Имена мастеров живут в core-api, поэтому резолвятся отдельно и сразу на
  // всю страницу выдачи — по карточке на запрос было бы восемь запросов.
  watchParticipantNames(() => games.value.map((game) => game.masterId));
</script>

<!--
  «Мои игры» — состояние того же раздела, что и каталог: шапка и фон те же,
  а «Мои игры» в шапке просто нажаты. Сводка встреч и игр, ждущих действия,
  стоит колонкой справа и забирает место у сетки карточек, а не у первого
  экрана.
-->
<template>
  <NuxtLayout
    name="detail"
    :title="GAMES_NAVIGATION_LABEL"
  >
    <template #actions>
      <GamesHeaderActions />
    </template>

    <template #default>
      <PageBackdrop />

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <aside class="lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1">
          <MyGamesOverview />
        </aside>

        <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <div class="flex flex-wrap items-center gap-2">
            <USelect
              v-model="tab"
              :items="tabItems"
              :icon="selectedSectionIcon"
              :aria-label="GAMES_MY_NAVIGATION_LABEL"
              value-key="value"
              color="primary"
              highlight
              :ui="{ leadingIcon: 'text-primary', value: 'font-medium' }"
              class="w-full sm:w-56"
            />

            <USelect
              v-if="isGameList"
              v-model="pickedStatus"
              :items="statusItems"
              :aria-label="MY_GAMES_STATUS_ALL_LABEL"
              value-key="value"
              :ui="{ content: 'min-w-64' }"
              class="w-full sm:w-44"
            />

            <span
              v-if="foundLabel"
              class="ml-auto text-sm text-muted tabular-nums"
            >
              {{ foundLabel }}
            </span>
          </div>

          <FollowedMastersPanel v-if="tab === MY_GAMES_TABS.MASTERS" />

          <BookmarkedPlayersPanel v-else-if="tab === MY_GAMES_TABS.PLAYERS" />

          <template v-else>
            <PageGrid
              v-if="isLoading"
              :columns="MY_GAMES_GRID_COLUMNS"
              gap="wide"
            >
              <GameCardSkeleton
                v-for="index in GAME_CATALOG_SKELETON_COUNT"
                :key="index"
              />
            </PageGrid>

            <UiResult
              v-else-if="isError"
              status="error"
              :title="MY_GAMES_ERROR_TITLE"
              :sub-title="getFindGameErrorMessage(error)"
            >
              <template #extra>
                <UButton
                  :label="CATALOG_RETRY_LABEL"
                  @click.left.exact.prevent="refresh()"
                />
              </template>
            </UiResult>

            <UiResult
              v-else-if="isEmpty"
              status="info"
              :title="emptyTitle"
              :sub-title="emptyDescription"
            >
              <template #extra>
                <UButton
                  v-if="isFavoritesTab"
                  :to="GAMES_ROUTE"
                  icon="tabler:search"
                  :label="GAMES_NAVIGATION_LABEL"
                />

                <UButton
                  v-else
                  :to="GAMES_CREATE_ROUTE"
                  icon="tabler:plus"
                  :label="GAMES_CREATE_NAVIGATION_LABEL"
                />
              </template>
            </UiResult>

            <template v-else>
              <PageGrid
                :columns="MY_GAMES_GRID_COLUMNS"
                gap="wide"
              >
                <GameCard
                  v-for="game in games"
                  :key="game.id"
                  :game="game"
                  :master-name="getParticipantName(game.masterId)"
                  show-status
                />
              </PageGrid>

              <UiPagination
                v-if="totalGames > pageSize"
                v-model:page="humanPage"
                :total="totalGames"
                :items-per-page="pageSize"
              />
            </template>
          </template>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>
