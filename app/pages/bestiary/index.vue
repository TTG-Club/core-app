<script setup lang="ts">
  import type {
    CreatureLinkResponse,
    CreatureSearchPageResponse,
    CreatureSearchResponse,
  } from '~bestiary/model';

  import { useChallengeRatingGroupOrder } from '~bestiary/composable';
  import { CreatureLink } from '~bestiary/link';
  import {
    BESTIARY_LIST_LOAD_MORE_DISTANCE,
    BESTIARY_LIST_PAGE_SIZE,
  } from '~bestiary/model';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Бестиарий [Bestiary]',
    description: 'Бестиарий из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    defaults: filterDefaults,
  } = await useFilter('bestiary', '/api/v2/bestiary/filters');

  const {
    order: challengeRatingOrder,
    pending: isChallengeRatingOrderPending,
  } = useChallengeRatingGroupOrder();

  const currentPage = ref(0);
  const bestiary = ref<Array<CreatureLinkResponse>>([]);
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

  function normalizeCreaturePage(
    response: CreatureSearchResponse | null | undefined,
  ): CreatureSearchPageResponse {
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

  async function fetchCreaturePage(
    page: number,
  ): Promise<CreatureSearchPageResponse> {
    const response = await $fetch<CreatureSearchResponse>(
      '/api/v2/bestiary/search',
      {
        method: 'GET',
        query: {
          page,
          size: BESTIARY_LIST_PAGE_SIZE,
          ...(search.value ? { search: search.value } : {}),
          ...filterQuery.value,
        },
      },
    );

    return normalizeCreaturePage(response);
  }

  const {
    data: firstCreaturePage,
    error,
    status,
    refresh,
  } = await useAsyncData('bestiary-search-page', () => fetchCreaturePage(0), {
    deep: false,
    watch: [search, filterQuery],
  });

  watch(
    firstCreaturePage,
    (page) => {
      currentPage.value = 0;
      bestiary.value = page?.value ?? [];
      hasNextPage.value = (page?.Count ?? 0) === BESTIARY_LIST_PAGE_SIZE;
    },
    { immediate: true },
  );

  async function loadNextCreaturePage(): Promise<void> {
    if (isLoadingMore.value || !hasNextPage.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      const nextPage = currentPage.value + 1;
      const page = await fetchCreaturePage(nextPage);

      currentPage.value = nextPage;
      bestiary.value = [...bestiary.value, ...page.value];
      hasNextPage.value = page.Count === BESTIARY_LIST_PAGE_SIZE;
    } finally {
      isLoadingMore.value = false;
    }
  }

  useInfiniteScroll(infiniteScrollTarget, loadNextCreaturePage, {
    distance: BESTIARY_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () => hasNextPage.value && !isLoadingMore.value,
  });

  const isLoading = computed(() => {
    const isBestiaryLoading =
      status.value !== 'success' && status.value !== 'error';

    return isBestiaryLoading || isChallengeRatingOrderPending.value;
  });
</script>

<template>
  <NuxtLayout
    name="section"
    title="Бестиарий"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      />
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
          v-else-if="status === 'success' && bestiary.length"
          virtual
          :virtual-threshold="BESTIARY_LIST_PAGE_SIZE"
          :items="bestiary"
          :reset-key="listResetKey"
          field="challengeRating"
          separator-label="Уровень опасности {value}"
          :group-sort="{
            mode: 'ordered',
            order: challengeRatingOrder,
            unknown: 'before',
          }"
        >
          <template #default="{ item }">
            <CreatureLink :creature="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="bestiary"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
