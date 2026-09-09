<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { GameCard, GameCardSkeleton } from '~find-game/catalog';
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
    FOLLOWED_MASTERS_TAB_LABEL,
    GAME_CATALOG_GRID_COLUMNS,
    GAME_CATALOG_SKELETON_COUNT,
    GAME_STATUS_LABELS,
    GAME_STATUSES,
    GAMES_CREATE_NAVIGATION_LABEL,
    GAMES_CREATE_ROUTE,
    GAMES_MY_NAVIGATION_LABEL,
    GAMES_ROUTE,
    getFindGameErrorMessage,
    MY_GAMES_EMPTY_DESCRIPTION,
    MY_GAMES_EMPTY_TITLE,
    MY_GAMES_ERROR_TITLE,
    MY_GAMES_STATUS_ALL_LABEL,
    MY_GAMES_STATUS_ALL_VALUE,
    MY_GAMES_STATUS_HINT,
    MY_GAMES_TAB_LABEL,
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
  } = useMyGames();

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

  /**
   * Вкладки раздела: свои игры и два списка отметок. Отметки живут здесь, а
   * не в профиле: игрока отмечают, чтобы позвать в игру, а мастера — чтобы не
   * пропустить его новую.
   */
  const tabItems = [
    {
      value: MY_GAMES_TABS.GAMES,
      label: MY_GAMES_TAB_LABEL,
      icon: 'tabler:cards',
    },
    {
      value: MY_GAMES_TABS.MASTERS,
      label: FOLLOWED_MASTERS_TAB_LABEL,
      icon: 'tabler:bookmark',
    },
    {
      value: MY_GAMES_TABS.PLAYERS,
      label: BOOKMARKED_PLAYERS_TAB_LABEL,
      icon: 'tabler:star',
    },
  ];

  const tab = ref<string>(MY_GAMES_TABS.GAMES);

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
        <UTabs
          v-model="tab"
          :items="tabItems"
          :content="false"
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
            :title="MY_GAMES_EMPTY_TITLE"
            :sub-title="MY_GAMES_EMPTY_DESCRIPTION"
          >
            <template #extra>
              <UButton
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
