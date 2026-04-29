<script setup lang="ts">
  import type {
    SpellLinkResponse,
    SpellSearchPageResponse,
    SpellSearchResponse,
  } from '~spells/model';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { SpellLegend } from '~spells/legend';
  import { SpellLink } from '~spells/link';
  import {
    SPELL_LIST_LOAD_MORE_DISTANCE,
    SPELL_LIST_PAGE_SIZE,
  } from '~spells/model';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  function getSpellLevelLabel(level: number | string): string {
    if (typeof level === 'string') {
      return level;
    }

    return !level ? 'Заговоры' : `Уровень ${level}`;
  }

  useSeoMeta({
    title: 'Заклинания [Spells]',
    description: 'Заклинания из D&D 5 (редакция 2024 года).',
  });

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
  const hasNextPage = ref(false);
  const isLoadingMore = ref(false);

  const infiniteScrollTarget = computed(() =>
    import.meta.client ? window : null,
  );

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
    }),
  );

  const { savedItemKey } = useSectionListScroll('spells', listResetKey);
  const isRestoringSavedPage = ref(false);

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
  ): Promise<SpellSearchPageResponse> {
    const response = await $fetch<SpellSearchResponse>(
      '/api/v2/spells/search',
      {
        method: 'GET',
        query: {
          page,
          size: SPELL_LIST_PAGE_SIZE,
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
  } = await useAsyncData('spells-search-page', () => fetchSpellPage(0), {
    deep: false,
    watch: [search, filterQuery],
  });

  watch(
    firstSpellPage,
    (page) => {
      currentPage.value = 0;
      spells.value = page?.value ?? [];
      hasNextPage.value = (page?.Count ?? 0) === SPELL_LIST_PAGE_SIZE;
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

  async function restoreSavedSpellPages(): Promise<void> {
    const savedSpellUrl = savedItemKey.value;

    if (
      !savedSpellUrl
      || isRestoringSavedPage.value
      || spells.value.some((spell) => spell.url === savedSpellUrl)
    ) {
      return;
    }

    isRestoringSavedPage.value = true;

    try {
      while (
        hasNextPage.value
        && !spells.value.some((spell) => spell.url === savedSpellUrl)
      ) {
        await loadNextSpellPage();
      }
    } finally {
      isRestoringSavedPage.value = false;
    }
  }

  useInfiniteScroll(infiniteScrollTarget, loadNextSpellPage, {
    distance: SPELL_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () => hasNextPage.value && !isLoadingMore.value,
  });

  watch(
    [spells, savedItemKey],
    () => {
      restoreSavedSpellPages();
    },
    {
      flush: 'post',
      immediate: true,
    },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );
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

        <GroupedList
          v-else-if="status === 'success' && spells.length"
          virtual
          :virtual-threshold="SPELL_LIST_PAGE_SIZE"
          :reset-key="listResetKey"
          :separator-label="getSpellLevelLabel"
          :items="spells"
          field="level"
        >
          <template #default="{ item }">
            <SpellLink :spell="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="spells"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
