<script setup lang="ts">
  import type { GameFilterChip } from '../model';

  import { FilterTag } from '~infrastructure/filter';
  import {
    FILTER_CONTROLS_FILTER_LABEL,
    FILTER_CONTROLS_RESET_LABEL,
    FILTER_CONTROLS_SHARE_LABEL,
    FILTER_SHARE_ICON,
    FILTER_SHARE_ICON_APPLE,
  } from '~infrastructure/filter/model';
  import { PageGrid } from '~ui/page';
  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';

  import {
    useGameCatalog,
    useGameSystems,
    useHumanPage,
    useParticipantNames,
  } from '../composables';
  import {
    CATALOG_EMPTY_DESCRIPTION,
    CATALOG_EMPTY_TITLE,
    CATALOG_ERROR_TITLE,
    CATALOG_FILTERS_RESET_LABEL,
    CATALOG_RETRY_LABEL,
    GAME_CATALOG_GRID_COLUMNS,
    GAME_CATALOG_SKELETON_COUNT,
    getGameFilterChips,
    getGamesFoundLabel,
  } from '../model';
  import { GameCard, GameCardSkeleton, GameCatalogFilters } from './ui';

  const {
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

  const humanPage = useHumanPage(page);

  const isError = computed(() => status.value === 'error');

  /**
   * Счётчик найденного над выдачей: по нему видно, что отбор сработал, и
   * сколько ещё игр лежит на других страницах. Пока выдачи нет — и пока она
   * грузится — счётчик не показывается: он мигал бы прежним числом.
   */
  const foundLabel = computed(() =>
    isLoading.value || isError.value || !totalGames.value
      ? null
      : getGamesFoundLabel(totalGames.value),
  );

  /** Применённые условия — ряд под панелью, как предпросмотр в справочнике. */
  const { systems } = useGameSystems();

  const filterChips = computed(() =>
    getGameFilterChips(filter.value, systems.value),
  );

  const route = useRoute();
  const { isApple } = useDevice();
  const { share } = useCopyAndShare();

  const shareIcon = isApple ? FILTER_SHARE_ICON_APPLE : FILTER_SHARE_ICON;

  const { watchParticipantNames } = useParticipantNames();

  // Имена мастеров живут в core-api, поэтому резолвятся отдельно и сразу на
  // всю страницу выдачи — по карточке на запрос было бы восемь запросов.
  watchParticipantNames(() => games.value.map((game) => game.masterId));

  /** Открывает панель фильтров. */
  function openFilters(): void {
    isFiltersOpen.value = true;
  }

  /**
   * Отдаёт ссылку на каталог с текущим отбором: фильтры живут в адресе, и
   * ссылка открывает ту же выдачу.
   */
  function shareCatalog(): void {
    share(getOrigin() + route.fullPath);
  }

  /**
   * Снимает одно условие по нажатию на его чип.
   * @param chip Чип снимаемого условия.
   */
  function removeFilterChip(chip: GameFilterChip): void {
    filter.value = chip.remove(filter.value);
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <!-- Та же пара кнопок, что в тулбаре фильтров справочника -->
      <UFieldGroup class="space-x-px">
        <UButton
          icon="tabler:filter"
          :label="FILTER_CONTROLS_FILTER_LABEL"
          @click.left.exact.prevent="openFilters"
        />

        <UButton
          v-if="hasActiveFilters"
          :title="FILTER_CONTROLS_RESET_LABEL"
          :aria-label="FILTER_CONTROLS_RESET_LABEL"
          icon="tabler:trash"
          @click.left.exact.prevent="resetFilter"
        />
      </UFieldGroup>

      <UButton
        :icon="shareIcon"
        :title="FILTER_CONTROLS_SHARE_LABEL"
        :aria-label="FILTER_CONTROLS_SHARE_LABEL"
        square
        @click.left.exact.prevent="shareCatalog"
      />

      <span
        v-if="foundLabel"
        class="ml-auto text-sm text-muted tabular-nums"
      >
        {{ foundLabel }}
      </span>
    </div>

    <div
      v-if="filterChips.length"
      class="flex flex-wrap gap-2"
    >
      <FilterTag
        v-for="chip in filterChips"
        :key="chip.key"
        :model-value="true"
        :exclude="chip.isExcluded"
        preview
        @update:model-value="removeFilterChip(chip)"
      >
        {{ chip.label }}
      </FilterTag>
    </div>

    <GameCatalogFilters
      v-model="filter"
      v-model:open="isFiltersOpen"
    />

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
      <PageGrid
        :columns="GAME_CATALOG_GRID_COLUMNS"
        gap="wide"
      >
        <GameCard
          v-for="game in games"
          :key="game.id"
          :game="game"
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
