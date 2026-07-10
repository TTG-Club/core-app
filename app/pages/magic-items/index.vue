<script setup lang="ts">
  import type {
    MagicItemDetailResponse,
    MagicItemLinkResponse,
  } from '~magic-items/model';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import {
    useListPresentation,
    useListPresentationMenus,
  } from '~infrastructure/list-presentation/composable';
  import { MagicItemBody } from '~magic-items/body';
  import { useMagicItemRarityGroupOrder } from '~magic-items/composable';
  import { MagicItemLegend } from '~magic-items/legend';
  import { MagicItemLink } from '~magic-items/link';
  import { createMagicItemListPresentationConfig } from '~magic-items/model';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Магические предметы [Magic Items] — D&D 5 (2024)',
    description: 'Магические предметы из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    defaults: filterDefaults,
  } = await useFilter('magic-items', '/api/v2/magic-items/filters');

  const { order: rarityOrder, pending: isRarityPending } =
    useMagicItemRarityGroupOrder();

  const magicItemListPresentationConfig = createMagicItemListPresentationConfig(
    () => rarityOrder.value,
  );

  const presentation = useListPresentation(magicItemListPresentationConfig);

  const presentationMenus = useListPresentationMenus(
    magicItemListPresentationConfig,
    presentation.grouping,
    presentation.sorting,
  );

  const {
    data: magicItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'magic-items',
    () =>
      $fetch<Array<MagicItemLinkResponse>>('/api/v2/magic-items/search', {
        method: 'GET',
        query: {
          search: search.value,
          ...filterQuery.value,
        },
      }),
    {
      deep: false,
      watch: [search, filterQuery],
    },
  );

  const {
    detailUrl,
    detailData: detailMagicItem,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
  } = useSectionDetail<MagicItemDetailResponse>({
    sectionPath: '/magic-items',
    apiBasePath: '/api/v2/magic-items',
    items: magicItems,
  });

  const isLoading = computed(() => {
    const isItemsLoading =
      status.value !== 'success' && status.value !== 'error';

    return (
      isItemsLoading
      || ((presentation.grouping.value === 'RARITY'
        || presentation.sorting.value === 'RARITY')
        && isRarityPending.value)
    );
  });

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
      presentation: presentation.resetKey.value,
    }),
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Магические предметы"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
        :presentation-menus="presentationMenus"
      >
        <template #legend>
          <MagicItemLegend />
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
          v-else-if="status === 'success' && magicItems?.length"
          :items="magicItems"
          :reset-key="listResetKey"
          :field="presentation.groupField.value"
          :group-sort="presentation.groupSort.value"
          :item-sort="presentation.itemSort.value"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <MagicItemLink :magic-item="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="magicItems"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailMagicItem?.name ?? ''"
        :source="detailMagicItem?.source"
        :date-time="detailMagicItem?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <MagicItemBody
          v-if="detailMagicItem"
          :magic-item="detailMagicItem"
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
            Магический предмет не выбран
          </h3>

          <p class="text-sm text-secondary">
            Выберите магический предмет из списка слева, чтобы просмотреть
            подробную информацию
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
