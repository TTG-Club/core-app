<script setup lang="ts">
  import type {
    GlossaryDetailResponse,
    GlossaryLinkResponse,
  } from '~glossary/model';

  import { GlossaryBody } from '~glossary/body';
  import { GlossaryLink } from '~glossary/link';
  import { getGlossaryMarkdown } from '~glossary/model';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { useListView } from '~infrastructure/list-presentation/composable';
  import { UiDetailPane, UiDetailPaneEmpty } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Глоссарий [Glossary] — D&D 5 (2024)',
    description: 'Глоссарий из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    defaults: filterDefaults,
  } = await useFilter('glossary', '/api/v2/glossary/filters');

  const {
    data: glossaryItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'glossary',
    () =>
      $fetch<Array<GlossaryLinkResponse>>('/api/v2/glossary/search', {
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
    detailData: detailGlossary,
    isDetailLoading,
    isDetailError,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  } = useSectionDetail<GlossaryDetailResponse>({
    sectionPath: '/glossary',
    apiBasePath: '/api/v2/glossary',
    items: glossaryItems,
  });

  const markdown = useEntityMarkdown(detailGlossary, getGlossaryMarkdown);

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
    title="Глоссарий"
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
          v-else-if="status === 'success' && glossaryItems?.length"
          :columns="listColumns"
          :items="glossaryItems"
          :reset-key="listResetKey"
          field="tagCategory"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <GlossaryLink :glossary="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="glossaryItems"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailGlossary?.name ?? ''"
        :source="detailGlossary?.source"
        :date-time="detailGlossary?.updatedAt"
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
        <GlossaryBody
          v-if="detailGlossary"
          :glossary="detailGlossary"
        />
      </UiDetailPane>

      <UiDetailPaneEmpty
        v-else
        title="Запись не выбрана"
        description="Выберите запись из списка, чтобы просмотреть подробную информацию"
      />
    </template>
  </NuxtLayout>
</template>
