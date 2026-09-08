<script setup lang="ts">
  import type { GamePersonalRole } from '~find-game/model';

  import { Role } from '~/shared/types';
  import {
    GameCard,
    GameCardSkeleton,
    MyGamesOverview,
  } from '~find-game/catalog';
  import { useMyGames, useParticipantNames } from '~find-game/composables';
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
    MY_GAMES_APPLICATIONS_LABEL,
    MY_GAMES_EMPTY_DESCRIPTION,
    MY_GAMES_EMPTY_TITLE,
    MY_GAMES_ERROR_TITLE,
    MY_GAMES_HOSTING_LABEL,
    MY_GAMES_PLAYING_LABEL,
    MY_GAMES_STATUS_ALL_LABEL,
    MY_GAMES_STATUS_HINT,
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
        : 'playing',
    set: (value: string) => {
      void router.replace({ query: { ...route.query, tab: value } });
    },
  });

  const personalRole = computed<GamePersonalRole>(() => {
    if (tab.value === 'hosting') {
      return 'MASTER';
    }

    if (tab.value === 'applications') {
      return 'APPLICATIONS';
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
  // «Все, кроме отменённых» — тоже вариант отбора, и своё значение ему нужно:
  // пустую строку список выбора не принимает.
  const ACTIVE_STATUSES = 'ACTIVE';

  const statusItems = computed(() => [
    { label: MY_GAMES_STATUS_ALL_LABEL, value: ACTIVE_STATUSES },
    ...GAME_STATUSES.map((value) => ({
      label: GAME_STATUS_LABELS[value],
      value,
    })),
  ]);

  const pickedStatus = computed({
    get: () => statuses.value[0] ?? ACTIVE_STATUSES,
    set: (value: string) => {
      const picked = GAME_STATUSES.find((status) => status === value);

      statuses.value = picked ? [picked] : [];
    },
  });

  // Пагинация Nuxt UI считает страницы с единицы, сервис — с нуля.
  const humanPage = computed({
    get: () => page.value + 1,
    set: (value: number) => {
      page.value = Math.max(0, value - 1);
    },
  });

  const isError = computed(() => status.value === 'error');

  /**
   * Вкладки раздела: свои игры и два списка отметок. Отметки живут здесь, а
   * не в профиле: игрока отмечают, чтобы позвать в игру, а мастера — чтобы не
   * пропустить его новую.
   */
  const tabItems = [
    { value: 'playing', label: MY_GAMES_PLAYING_LABEL, icon: 'tabler:users' },
    { value: 'hosting', label: MY_GAMES_HOSTING_LABEL, icon: 'tabler:cards' },
    {
      value: 'applications',
      label: MY_GAMES_APPLICATIONS_LABEL,
      icon: 'tabler:send',
    },
    {
      value: 'masters',
      label: FOLLOWED_MASTERS_TAB_LABEL,
      icon: 'tabler:bookmark',
    },
    {
      value: 'players',
      label: BOOKMARKED_PLAYERS_TAB_LABEL,
      icon: 'tabler:star',
    },
  ];

  const { getParticipantName, resolveNames } = useParticipantNames();

  // Имена мастеров живут в core-api, поэтому резолвятся отдельно и сразу на
  // всю страницу выдачи — по карточке на запрос было бы восемь запросов.
  watch(
    games,
    (list) => {
      void resolveNames(list.map((item) => item.masterId));
    },
    { immediate: true },
  );
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

        <FollowedMastersPanel v-if="tab === 'masters'" />

        <BookmarkedPlayersPanel v-else-if="tab === 'players'" />

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
            <PageGrid :columns="GAME_CATALOG_GRID_COLUMNS">
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
