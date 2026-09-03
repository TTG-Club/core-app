<script setup lang="ts">
  import { PageGrid } from '~ui/page';
  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';

  import { useGameCatalog, useParticipantNames } from '../composables';
  import {
    CATALOG_EMPTY_DESCRIPTION,
    CATALOG_EMPTY_TITLE,
    CATALOG_ERROR_TITLE,
    CATALOG_FILTERS_RESET_LABEL,
    CATALOG_FILTERS_TITLE,
    CATALOG_RETRY_LABEL,
    GAME_CATALOG_GRID_COLUMNS,
    GAME_CATALOG_SKELETON_COUNT,
  } from '../model';
  import { GameCard, GameCardSkeleton, GameCatalogFilters } from './ui';

  const {
    activeFilterCount,
    error,
    filter,
    games,
    hasActiveFilters,
    isEmpty,
    isLoading,
    page,
    pageSize,
    refresh,
    resetFilter,
    status,
    totalGames,
  } = useGameCatalog();

  const isFiltersOpen = ref(false);

  // Пагинация Nuxt UI считает страницы с единицы, сервис — с нуля.
  const humanPage = computed({
    get: () => page.value + 1,
    set: (value: number) => {
      page.value = Math.max(0, value - 1);
    },
  });

  const isError = computed(() => status.value === 'error');

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

  /** Открывает панель фильтров. */
  function openFilters(): void {
    isFiltersOpen.value = true;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        color="neutral"
        variant="subtle"
        icon="tabler:filter"
        :label="CATALOG_FILTERS_TITLE"
        @click.left.exact.prevent="openFilters"
      >
        <template
          v-if="activeFilterCount"
          #trailing
        >
          <UBadge
            color="primary"
            variant="solid"
            size="sm"
            :label="String(activeFilterCount)"
          />
        </template>
      </UButton>

      <UButton
        v-if="hasActiveFilters"
        color="neutral"
        variant="ghost"
        icon="tabler:rotate"
        :label="CATALOG_FILTERS_RESET_LABEL"
        @click.left.exact.prevent="resetFilter"
      />
    </div>

    <GameCatalogFilters
      v-model="filter"
      v-model:open="isFiltersOpen"
      :active-count="activeFilterCount"
      @reset="resetFilter"
    />

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
      :title="CATALOG_ERROR_TITLE"
      :sub-title="error?.message"
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
      :title="CATALOG_EMPTY_TITLE"
      :sub-title="CATALOG_EMPTY_DESCRIPTION"
    >
      <template #extra>
        <UButton
          v-if="hasActiveFilters"
          :label="CATALOG_FILTERS_RESET_LABEL"
          @click.left.exact.prevent="resetFilter"
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
        />
      </PageGrid>

      <UiPagination
        v-if="totalGames > pageSize"
        v-model:page="humanPage"
        :total="totalGames"
        :items-per-page="pageSize"
      />
    </template>
  </div>
</template>
