<script setup lang="ts">
  import type {
    CreatureDetailResponse,
    CreatureLinkResponse,
    CreatureSearchPageResponse,
    CreatureSearchResponse,
  } from '~bestiary/model';

  import { CreatureBody } from '~bestiary/body';
  import { useChallengeRatingGroupOrder } from '~bestiary/composable';
  import { CreatureLink } from '~bestiary/link';
  import {
    BESTIARY_LIST_LOAD_MORE_DISTANCE,
    BESTIARY_LIST_PAGE_SIZE,
    createBestiaryListPresentationConfig,
  } from '~bestiary/model';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import {
    useListPresentation,
    useListPresentationMenus,
  } from '~infrastructure/list-presentation/composable';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Бестиарий [Bestiary] — D&D 5 (2024)',
    description: 'Бестиарий из D&D 5 (редакция 2024 года).',
  });

  const { isSplitActive } = useLayoutWidth();

  const currentPage = ref(0);
  const bestiary = ref<Array<CreatureLinkResponse>>([]);
  const hasNextPage = ref(false);
  const isLoadingMore = ref(false);

  const {
    detailUrl,
    detailData: detailCreature,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
  } = useSectionDetail<CreatureDetailResponse>({
    sectionPath: '/bestiary',
    apiBasePath: '/api/v2/bestiary',
    items: bestiary,
  });

  // Фильтры (асинхронный вызов)
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

  const bestiaryListPresentationConfig = createBestiaryListPresentationConfig(
    () => challengeRatingOrder.value,
  );

  const presentation = useListPresentation(bestiaryListPresentationConfig);

  const presentationMenus = useListPresentationMenus(
    bestiaryListPresentationConfig,
    presentation.grouping,
    presentation.sorting,
  );

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
    useSectionListScroll('bestiary', listResetKey);

  const isRestoringSavedPage = ref(false);

  const firstCreaturePageSize = computed(() => {
    return hasSavedPosition.value && typeof savedPage.value === 'number'
      ? (savedPage.value + 1) * BESTIARY_LIST_PAGE_SIZE
      : BESTIARY_LIST_PAGE_SIZE;
  });

  // Целевой URL монстра для прокрутки/загрузки: либо сохраненный из скролла, либо из URL
  const targetCreatureUrl = computed(() => {
    if (savedItemKey.value) {
      return savedItemKey.value;
    }

    return detailUrl.value;
  });

  const isTargetCreatureLoaded = computed(() => {
    const targetUrl = targetCreatureUrl.value;

    if (!targetUrl) {
      return true;
    }

    return bestiary.value.some((creature) => creature.url === targetUrl);
  });

  const isTargetCreatureRestorePending = computed(() => {
    return (
      (hasSavedPosition.value || detailUrl.value)
      && !isTargetCreatureLoaded.value
      && hasNextPage.value
    );
  });

  /**
   * Приведение ответа от апи поиска монстров к общему типу.
   * @param response Ответ от сервера.
   */
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

  /**
   * Загрузка страницы со списком монстров.
   * @param page Номер страницы.
   * @param size Количество элементов.
   */
  async function fetchCreaturePage(
    page: number,
    size: number = BESTIARY_LIST_PAGE_SIZE,
  ): Promise<CreatureSearchPageResponse> {
    const response = await $fetch<CreatureSearchResponse>(
      '/api/v2/bestiary/search',
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

    return normalizeCreaturePage(response);
  }

  const {
    data: firstCreaturePage,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'bestiary-search-page',
    () => fetchCreaturePage(0, firstCreaturePageSize.value),
    {
      deep: false,
      watch: [search, filterQuery, presentation.resetKey],
    },
  );

  watch(
    firstCreaturePage,
    (page) => {
      currentPage.value = 0;
      bestiary.value = page?.value ?? [];

      currentPage.value = Math.max(
        0,
        Math.ceil(bestiary.value.length / BESTIARY_LIST_PAGE_SIZE) - 1,
      );

      hasNextPage.value = (page?.Count ?? 0) === firstCreaturePageSize.value;
    },
    { immediate: true },
  );

  /**
   * Подгрузка следующей страницы списка.
   */
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

  /**
   * Восстановление сохраненных страниц бестиария до целевого существа.
   */
  async function restoreSavedCreaturePages(): Promise<void> {
    const targetUrl = targetCreatureUrl.value;

    if (
      !targetUrl
      || isRestoringSavedPage.value
      || isTargetCreatureLoaded.value
    ) {
      return;
    }

    isRestoringSavedPage.value = true;

    try {
      while (hasNextPage.value && !isTargetCreatureLoaded.value) {
        if (isLoadingMore.value) {
          await until(isLoadingMore).toBe(false);

          continue;
        }

        await loadNextCreaturePage();
      }
    } finally {
      isRestoringSavedPage.value = false;
    }
  }

  useInfiniteScroll(windowScrollTarget, loadNextCreaturePage, {
    distance: BESTIARY_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () => hasNextPage.value && !isLoadingMore.value,
  });

  useInfiniteScroll(splitScrollTarget, loadNextCreaturePage, {
    distance: BESTIARY_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () => hasNextPage.value && !isLoadingMore.value,
  });

  /**
   * Запоминание текущей страницы для сохранения позиции.
   */
  function rememberSavedCreaturePage(): void {
    const savedCreatureUrl = savedItemKey.value;

    if (!savedCreatureUrl) {
      return;
    }

    const savedCreatureIndex = bestiary.value.findIndex((creature) => {
      return creature.url === savedCreatureUrl;
    });

    if (savedCreatureIndex < 0) {
      return;
    }

    rememberCurrentPage(
      Math.floor(savedCreatureIndex / BESTIARY_LIST_PAGE_SIZE),
    );
  }

  watch(savedItemKey, rememberSavedCreaturePage, { flush: 'sync' });

  watch(
    [bestiary, targetCreatureUrl],
    () => {
      restoreSavedCreaturePages();
    },
    {
      flush: 'post',
      immediate: true,
    },
  );

  const isLoading = computed(() => {
    const isBestiaryLoading =
      status.value !== 'success' && status.value !== 'error';

    return (
      isBestiaryLoading
      || (presentation.grouping.value === 'CHALLENGE_RATING'
        && isChallengeRatingOrderPending.value)
      || isRestoringSavedPage.value
      || isTargetCreatureRestorePending.value
    );
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
        :presentation-menus="presentationMenus"
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
          :field="presentation.groupField.value"
          :separator-label="presentation.separatorLabel.value"
          :group-sort="presentation.groupSort.value"
          :active-item-key="detailUrl"
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

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailCreature?.name ?? ''"
        :source="detailCreature?.source"
        :date-time="detailCreature?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <CreatureBody
          v-if="detailCreature"
          :creature="detailCreature"
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
            Существо не выбрано
          </h3>

          <p class="text-sm text-secondary">
            Выберите существо из списка слева, чтобы просмотреть подробную
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
