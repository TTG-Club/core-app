<script setup lang="ts">
  import type { FeatDetailResponse, FeatLinkResponse } from '~feats/model';

  import { FeatBody } from '~feats/body';
  import { FeatLink } from '~feats/link';
  import { getFeatMarkdown } from '~feats/model';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { useListView } from '~infrastructure/list-presentation/composable';
  import { UiDetailPane, UiDetailPaneEmpty } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Черты [Feats] — D&D 5 (2024)',
    description: 'Черты из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    defaults: filterDefaults,
  } = await useFilter('feats', '/api/v2/feats/filters');

  const {
    data: feats,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'feats',
    () =>
      $fetch<Array<FeatLinkResponse>>('/api/v2/feats/search', {
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
    detailData: detailFeat,
    isDetailLoading,
    isDetailError,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  } = useSectionDetail<FeatDetailResponse>({
    sectionPath: '/feats',
    apiBasePath: '/api/v2/feats',
    items: feats,
  });

  const markdown = useEntityMarkdown(detailFeat, getFeatMarkdown);

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
    }),
  );

  const { columns: listColumns } = useListView();
</script>

<template>
  <NuxtLayout
    name="section"
    collapsible-controls
    title="Черты"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
      >
      </FilterControls>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid
          v-if="status !== 'success' && status !== 'error'"
          :columns="3"
        >
          <SkeletonLinkSmall
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <GroupedList
          v-else-if="status === 'success' && feats?.length"
          :columns="listColumns"
          :items="feats"
          :reset-key="listResetKey"
          field="category"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <FeatLink :feat="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="feats"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailFeat?.name ?? ''"
        :source="detailFeat?.source"
        :date-time="detailFeat?.updatedAt"
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
        <FeatBody
          v-if="detailFeat"
          :feat="detailFeat"
        />
      </UiDetailPane>

      <UiDetailPaneEmpty
        v-else
        title="Черта не выбрана"
        description="Выберите черту из списка слева, чтобы просмотреть подробную информацию"
      />
    </template>
  </NuxtLayout>
</template>
