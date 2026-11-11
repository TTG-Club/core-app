<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/model';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import {
    useListPresentation,
    useListPresentationMenus,
    useListView,
  } from '~infrastructure/list-presentation/composable';
  import { ItemBody } from '~items/body';
  import { ItemLink } from '~items/link';
  import {
    createItemListPresentationConfig,
    getItemMarkdown,
    getItemTypeLabels,
    parseItemLinks,
  } from '~items/model';
  import { UiDetailPane, UiDetailPaneEmpty } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Предметы [Items] — D&D 5 (2024)',
    description: 'Предметы из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    defaults: filterDefaults,
  } = await useFilter('items', '/api/v2/item/filters');

  // Подписи групп живут в фильтрах раздела, поэтому иерархия строится по уже
  // провалидированному состоянию фильтра, а не отдельным запросом.
  const itemTypeLabels = computed(() =>
    getItemTypeLabels(filter.value?.filters ?? []),
  );

  const itemListPresentationConfig = createItemListPresentationConfig(
    () => itemTypeLabels.value,
  );

  const presentation = useListPresentation(itemListPresentationConfig);

  const presentationMenus = useListPresentationMenus(
    itemListPresentationConfig,
    presentation.grouping,
    presentation.sorting,
  );

  const { columns: listColumns } = useListView();

  const {
    data: items,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'items',
    async () =>
      parseItemLinks(
        await $fetch<unknown>('/api/v2/item/search', {
          method: 'GET',
          query: {
            search: search.value,
            ...filterQuery.value,
          },
        }),
      ),
    {
      deep: false,
      watch: [search, filterQuery],
    },
  );

  const {
    detailUrl,
    detailData: detailItem,
    isDetailLoading,
    isDetailError,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  } = useSectionDetail<ItemDetailResponse>({
    sectionPath: '/items',
    apiBasePath: '/api/v2/item',
    items,
  });

  const markdown = useEntityMarkdown(detailItem, getItemMarkdown);

  // Группировка по категории берёт подписи из фильтров: пока они грузятся,
  // список показывать нечем — иначе группы мигнут без подписей подгрупп.
  const isLoading = computed(() => {
    const isItemsLoading =
      status.value !== 'success' && status.value !== 'error';

    return (
      isItemsLoading
      || (presentation.grouping.value === 'CATEGORY' && isFilterPending.value)
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
    collapsible-controls
    title="Предметы"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :presentation-menus="presentationMenus"
      >
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
          v-else-if="status === 'success' && items?.length"
          :columns="listColumns"
          :items="items"
          :reset-key="listResetKey"
          :field="presentation.groupField.value"
          :group-sort="presentation.groupSort.value"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <ItemLink :item="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="items"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailItem?.name ?? ''"
        :source="detailItem?.source"
        :date-time="detailItem?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :markdown
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        :neighbours="detailNeighbours"
        @close="handleCloseDetail"
        @navigate="openDetail"
      >
        <ItemBody
          v-if="detailItem"
          :item="detailItem"
        />
      </UiDetailPane>

      <UiDetailPaneEmpty
        v-else
        title="Предмет не выбран"
        description="Выберите предмет из списка, чтобы просмотреть подробную информацию"
      />
    </template>
  </NuxtLayout>
</template>
