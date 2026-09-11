<script setup lang="ts">
  import type { GamePersonalRole } from '~find-game/model';

  import { Role } from '~/shared/types';
  import {
    GameCard,
    GameCardSkeleton,
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
    GAME_CATALOG_GRID_COLUMNS,
    GAME_CATALOG_SKELETON_COUNT,
    GAME_STATUS_LABELS,
    GAME_STATUSES,
    GAMES_CREATE_NAVIGATION_LABEL,
    GAMES_CREATE_ROUTE,
    GAMES_MY_NAVIGATION_LABEL,
    GAMES_NAVIGATION_LABEL,
    GAMES_ROUTE,
    getFindGameErrorMessage,
    MY_GAMES_APPLICATIONS_LABEL,
    MY_GAMES_EMPTY_DESCRIPTION,
    MY_GAMES_EMPTY_TITLE,
    MY_GAMES_ERROR_TITLE,
    MY_GAMES_HOSTING_LABEL,
    MY_GAMES_PLAYING_LABEL,
    MY_GAMES_STATUS_ALL_LABEL,
    MY_GAMES_STATUS_ALL_VALUE,
    MY_GAMES_STATUS_HINT,
    MY_GAMES_TABS,
  } from '~find-game/model';
  import { NotificationsBell } from '~find-game/notifications';
  import { PageGrid } from '~ui/page';
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
      typeof route.query.tab === 'string' && route.query.tab
        ? route.query.tab
        : MY_GAMES_TABS.PLAYING,
    set: (value: string) => {
      void router.replace({ query: { ...route.query, tab: value } });
    },
  });

  const personalRole = computed<GamePersonalRole>(() => {
    if (tab.value === MY_GAMES_TABS.HOSTING) {
      return 'MASTER';
    }

    if (tab.value === MY_GAMES_TABS.APPLICATIONS) {
      return 'APPLICATIONS';
    }

    if (tab.value === MY_GAMES_TABS.FAVORITES) {
      return 'FAVORITE';
    }

    return 'PLAYER';
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
   * состоянию. Отменённые лежат за отдельным чипом: они не состоялись, и в
   * общем списке только мешают.
   */
  const statusItems = computed(() => [
    { label: MY_GAMES_STATUS_ALL_LABEL, value: MY_GAMES_STATUS_ALL_VALUE },
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
   * Вкладки раздела: срезы своих игр, избранное и два списка отметок. Отметки
   * живут здесь, а не в профиле: игрока отмечают, чтобы позвать в игру, а
   * мастера — чтобы не пропустить его новую.
   */
  const tabItems = [
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

  const { getParticipantName, watchParticipantNames } = useParticipantNames();

  // Имена мастеров живут в core-api, поэтому резолвятся отдельно и сразу на
  // всю страницу выдачи — по карточке на запрос было бы восемь запросов.
  watchParticipantNames(() => games.value.map((game) => game.masterId));
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="GAMES_MY_NAVIGATION_LABEL"
    :back-to="GAMES_ROUTE"
  >
    <template #actions>
      <NotificationsBell />

      <UButton
        :to="GAMES_CREATE_ROUTE"
        icon="tabler:plus"
        :label="GAMES_CREATE_NAVIGATION_LABEL"
      />
    </template>

    <template #default>
      <div class="flex flex-col gap-4">
        <MyGamesOverview />

        <UTabs
          v-model="tab"
          :items="tabItems"
          :content="false"
          :ui="{ list: 'flex-wrap' }"
          class="w-full"
        />

        <FollowedMastersPanel v-if="tab === MY_GAMES_TABS.MASTERS" />

        <BookmarkedPlayersPanel v-else-if="tab === MY_GAMES_TABS.PLAYERS" />

        <template v-else>
          <UFormField :hint="MY_GAMES_STATUS_HINT">
            <USelect
              v-model="pickedStatus"
              :items="statusItems"
              value-key="value"
              class="w-52"
            />
          </UFormField>

          <PageGrid
            v-if="isLoading"
            :columns="GAME_CATALOG_GRID_COLUMNS"
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
              :columns="GAME_CATALOG_GRID_COLUMNS"
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
    </template>
  </NuxtLayout>
</template>
