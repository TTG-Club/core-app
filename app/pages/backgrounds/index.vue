<script setup lang="ts">
  import type {
    BackgroundDetailResponse,
    BackgroundLinkResponse,
  } from '~backgrounds/model';

  import { BackgroundBody } from '~backgrounds/body';
  import { BackgroundLink } from '~backgrounds/link';
  import { getBackgroundMarkdown } from '~backgrounds/model';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { useListView } from '~infrastructure/list-presentation/composable';
  import { UiDetailPane, UiDetailPaneEmpty } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Предыстории [Backgrounds] — D&D 5 (2024)',
    description: 'Предыстории из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    defaults: filterDefaults,
  } = await useFilter('backgrounds', '/api/v2/backgrounds/filters');

  const {
    data: backgrounds,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'backgrounds',
    () =>
      $fetch<Array<BackgroundLinkResponse>>('/api/v2/backgrounds/search', {
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
    detailData: detailBackground,
    isDetailLoading,
    isDetailError,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  } = useSectionDetail<BackgroundDetailResponse>({
    sectionPath: '/backgrounds',
    apiBasePath: '/api/v2/backgrounds',
    items: backgrounds,
  });

  const markdown = useEntityMarkdown(detailBackground, getBackgroundMarkdown);

  const { columns: listColumns } = useListView();
</script>

<template>
  <NuxtLayout
    name="section"
    collapsible-controls
    title="Предыстории"
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
          v-else-if="status === 'success' && backgrounds?.length"
          :columns="listColumns"
          :items="backgrounds"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <BackgroundLink :background="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="backgrounds"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailBackground?.name ?? ''"
        :source="detailBackground?.source"
        :date-time="detailBackground?.updatedAt"
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
        <BackgroundBody
          v-if="detailBackground"
          :background="detailBackground"
        />
      </UiDetailPane>

      <UiDetailPaneEmpty
        v-else
        title="Предыстория не выбрана"
        description="Выберите предысторию из списка слева, чтобы просмотреть подробную информацию"
      />
    </template>
  </NuxtLayout>
</template>
