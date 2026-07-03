<script setup lang="ts">
  import type {
    SpellDetailResponse,
    SpellLinkResponse,
    SpellSearchPageResponse,
    SpellSearchResponse,
  } from '~spells/model';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { useListPresentation } from '~infrastructure/list-presentation/composable';
  import { ListPresentationControls } from '~infrastructure/list-presentation/ui';
  import { SpellBody } from '~spells/body';
  import { useSpellClassPagination } from '~spells/composable';
  import { SpellClassGroups } from '~spells/groups';
  import { SpellLegend } from '~spells/legend';
  import { SpellLink } from '~spells/link';
  import {
    SPELL_LIST_LOAD_MORE_DISTANCE,
    SPELL_LIST_PAGE_SIZE,
    SPELL_LIST_PRESENTATION_CONFIG,
  } from '~spells/model';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Заклинания [Spells]',
    description: 'Заклинания из D&D 5 (редакция 2024 года).',
  });

  const { isSplitActive } = useLayoutWidth();

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    defaults: filterDefaults,
  } = await useFilter('spells', '/api/v2/spells/filters');

  const currentPage = ref(0);
  const spells = ref<Array<SpellLinkResponse>>([]);

  const presentation = useListPresentation(SPELL_LIST_PRESENTATION_CONFIG);

  const isClassGrouping = computed(
    () => presentation.grouping.value === 'CLASS',
  );

  const spellSorting = computed(() => presentation.query.value.sorting);

  const {
    groups: spellClassGroups,
    isLoading: areSpellClassGroupsLoading,
    hasError: hasSpellClassGroupsError,
    loadedSpells: loadedClassSpells,
    loadNextPage: loadNextSpellClassPage,
    refresh: refreshSpellClassGroups,
  } = useSpellClassPagination({
    filter,
    filterQuery,
    isActive: isClassGrouping,
    search,
    sorting: spellSorting,
  });

  const visibleSpells = computed(() =>
    isClassGrouping.value ? loadedClassSpells.value : spells.value,
  );

  const hasNextPage = ref(false);
  const isLoadingMore = ref(false);

  const {
    detailUrl,
    detailData: detailSpell,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
  } = useSectionDetail<SpellDetailResponse>({
    sectionPath: '/spells',
    apiBasePath: '/api/v2/spells',
    items: visibleSpells,
  });

  // Динамический таргет для бесконечного скролла
  // В стандартном режиме — window с большим distance (900px),
  // в Wide Mode — контейнер списка с аналогичным distance (900px) для своевременной подгрузки.
  const windowScrollTarget = computed(() =>
    import.meta.client && !isSplitActive.value ? window : null,
  );

  const splitScrollTarget = shallowRef<HTMLElement | null>(null);

  /**
   * Поиск DOM-контейнера для скролла в Wide Mode.
   * Использует requestAnimationFrame для повторной попытки,
   * т.к. элемент может ещё не быть в DOM при первом вызове.
   */
  function resolveSplitContainer(): void {
    const container = document.getElementById('section-list-container');

    if (container) {
      splitScrollTarget.value = container;

      return;
    }

    requestAnimationFrame(() => {
      splitScrollTarget.value = document.getElementById(
        'section-list-container',
      );
    });
  }

  if (import.meta.client) {
    onMounted(() => {
      watch(
        isSplitActive,
        (active) => {
          if (active) {
            resolveSplitContainer();
          } else {
            splitScrollTarget.value = null;
          }
        },
        { immediate: true },
      );
    });
  }

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
      presentation: presentation.resetKey.value,
    }),
  );

  const { hasSavedPosition, rememberCurrentPage, savedItemKey, savedPage } =
    useSectionListScroll('spells', listResetKey);

  const isRestoringSavedPage = ref(false);

  const firstSpellPageSize = computed(() => {
    return hasSavedPosition.value && typeof savedPage.value === 'number'
      ? (savedPage.value + 1) * SPELL_LIST_PAGE_SIZE
      : SPELL_LIST_PAGE_SIZE;
  });

  // Целевой URL заклинания для прокрутки/загрузки: либо сохраненный из скролла, либо из URL
  const targetSpellUrl = computed(() => {
    if (savedItemKey.value) {
      return savedItemKey.value;
    }

    return detailUrl.value;
  });

  const isTargetSpellLoaded = computed(() => {
    const targetUrl = targetSpellUrl.value;

    if (!targetUrl) {
      return true;
    }

    return spells.value.some((spell) => spell.url === targetUrl);
  });

  const isTargetSpellRestorePending = computed(() => {
    return (
      (hasSavedPosition.value || detailUrl.value)
      && !isTargetSpellLoaded.value
      && hasNextPage.value
    );
  });

  function normalizeSpellPage(
    response: SpellSearchResponse | null | undefined,
  ): SpellSearchPageResponse {
    if (Array.isArray(response)) {
      return {
        value: response,
        Count: response.length,
      };
    }

    return {
      value: response?.value ?? [],
      Count: response?.Count ?? 0,
    };
  }

  async function fetchSpellPage(
    page: number,
    size: number = SPELL_LIST_PAGE_SIZE,
  ): Promise<SpellSearchPageResponse> {
    const response = await $fetch<SpellSearchResponse>(
      '/api/v2/spells/search',
      {
        method: 'GET',
        query: {
          page,
          size,
          ...presentation.query.value,
          ...(search.value ? { search: search.value } : {}),
          ...filterQuery.value,
        },
      },
    );

    return normalizeSpellPage(response);
  }

  const {
    data: firstSpellPage,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'spells-search-page',
    () =>
      isClassGrouping.value
        ? Promise.resolve({ value: [], Count: 0 })
        : fetchSpellPage(0, firstSpellPageSize.value),
    {
      deep: false,
      watch: [search, filterQuery, presentation.resetKey],
    },
  );

  watch(
    firstSpellPage,
    (page) => {
      currentPage.value = 0;
      spells.value = page?.value ?? [];

      currentPage.value = Math.max(
        0,
        Math.ceil(spells.value.length / SPELL_LIST_PAGE_SIZE) - 1,
      );

      hasNextPage.value = (page?.Count ?? 0) === firstSpellPageSize.value;
    },
    { immediate: true },
  );

  async function loadNextSpellPage(): Promise<void> {
    if (isLoadingMore.value || !hasNextPage.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      const nextPage = currentPage.value + 1;
      const page = await fetchSpellPage(nextPage);

      currentPage.value = nextPage;
      spells.value = [...spells.value, ...page.value];
      hasNextPage.value = page.Count === SPELL_LIST_PAGE_SIZE;
    } finally {
      isLoadingMore.value = false;
    }
  }

  /**
   * Восстановление сохраненных страниц заклинаний до целевого элемента.
   */
  async function restoreSavedSpellPages(): Promise<void> {
    const targetUrl = targetSpellUrl.value;

    if (!targetUrl || isRestoringSavedPage.value || isTargetSpellLoaded.value) {
      return;
    }

    isRestoringSavedPage.value = true;

    try {
      while (hasNextPage.value && !isTargetSpellLoaded.value) {
        if (isLoadingMore.value) {
          await until(isLoadingMore).toBe(false);

          continue;
        }

        await loadNextSpellPage();
      }
    } finally {
      isRestoringSavedPage.value = false;
    }
  }

  useInfiniteScroll(windowScrollTarget, loadNextSpellPage, {
    distance: SPELL_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () =>
      !isClassGrouping.value && hasNextPage.value && !isLoadingMore.value,
  });

  useInfiniteScroll(splitScrollTarget, loadNextSpellPage, {
    distance: SPELL_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () =>
      !isClassGrouping.value && hasNextPage.value && !isLoadingMore.value,
  });

  function rememberSavedSpellPage(): void {
    const savedSpellUrl = savedItemKey.value;

    if (!savedSpellUrl) {
      return;
    }

    const savedSpellIndex = spells.value.findIndex((spell) => {
      return spell.url === savedSpellUrl;
    });

    if (savedSpellIndex < 0) {
      return;
    }

    rememberCurrentPage(Math.floor(savedSpellIndex / SPELL_LIST_PAGE_SIZE));
  }

  watch(savedItemKey, rememberSavedSpellPage, { flush: 'sync' });

  watch(
    [spells, targetSpellUrl],
    () => {
      restoreSavedSpellPages();
    },
    {
      flush: 'post',
      immediate: true,
    },
  );

  const isLoading = computed(() => {
    if (isClassGrouping.value) {
      return areSpellClassGroupsLoading.value;
    }

    return (
      (status.value !== 'success' && status.value !== 'error')
      || isRestoringSavedPage.value
      || isTargetSpellRestorePending.value
    );
  });

  /** Повторно загружает текущий режим списка заклинаний. */
  async function handleRefresh(): Promise<void> {
    if (isClassGrouping.value) {
      await refreshSpellClassGroups();

      return;
    }

    await refresh();
  }
</script>

<template>
  <NuxtLayout
    name="section"
    title="Заклинания"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <SpellLegend />
        </template>

        <template #actions>
          <ListPresentationControls
            v-model:grouping="presentation.grouping.value"
            v-model:sorting="presentation.sorting.value"
            :config="SPELL_LIST_PRESENTATION_CONFIG"
          />
        </template>
      </FilterControls>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid
          v-if="isLoading"
          :columns="3"
        >
          <SkeletonLinkSmall
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <SpellClassGroups
          v-else-if="isClassGrouping && spellClassGroups.length"
          :groups="spellClassGroups"
          @load-more="loadNextSpellClassPage"
        />

        <GroupedList
          v-else-if="status === 'success' && spells.length"
          virtual
          :virtual-threshold="SPELL_LIST_PAGE_SIZE"
          :reset-key="listResetKey"
          :separator-label="presentation.separatorLabel.value"
          :items="spells"
          :field="presentation.groupField.value"
          :group-sort="presentation.groupSort.value"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <SpellLink :spell="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="visibleSpells"
          :status="
            isClassGrouping && !hasSpellClassGroupsError ? 'success' : status
          "
          :error
          @refresh="handleRefresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailSpell?.name ?? ''"
        :source="detailSpell?.source"
        :date-time="detailSpell?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <SpellBody
          v-if="detailSpell"
          :spell="detailSpell"
        />
      </UiDetailPane>

      <div
        v-else-if="isDetailDismissed"
        class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
      >
        <div class="flex max-w-xs flex-col items-center gap-3">
          <UIcon
            name="tabler:click"
            class="size-10 text-muted"
          />

          <h3 class="text-lg font-semibold text-highlighted">
            Заклинание не выбрано
          </h3>

          <p class="text-sm text-secondary">
            Выберите заклинание из списка слева, чтобы просмотреть подробную
            информацию
          </p>
        </div>
      </div>

      <UiDetailPane
        v-else
        title=""
        :is-loading="true"
      />
    </template>
  </NuxtLayout>
</template>
