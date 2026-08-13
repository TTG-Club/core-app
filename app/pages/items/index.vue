<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/model';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import {
    useListPresentation,
    useListPresentationMenus,
  } from '~infrastructure/list-presentation/composable';
  import { ItemBody } from '~items/body';
  import { ItemLink } from '~items/link';
  import {
    createItemListPresentationConfig,
    getItemMarkdown,
    getItemTypeLabels,
    parseItemLinks,
  } from '~items/model';
  import { UiDetailPane } from '~ui/detail-pane';
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
    isShowedPreview: isFilterPreviewShowed,
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
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
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
    title="Предметы"
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
        @close="handleCloseDetail"
      >
        <ItemBody
          v-if="detailItem"
          :item="detailItem"
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
            Предмет не выбран
          </h3>

          <p class="text-sm text-secondary">
            Выберите предмет из списка слева, чтобы просмотреть подробную
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
