<script setup lang="ts">
  import type { GlossaryLinkResponse } from '~glossary/model';

  import { GlossaryLink } from '~glossary/link';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Глоссарий [Glossary]',
    description: 'Глоссарий из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    selectedFiltersQuery,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    data: filterDefaults,
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
          ...selectedFiltersQuery.value,
        },
      }),
    {
      deep: false,
      watch: [search, selectedFiltersQuery],
    },
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Глоссарий"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
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
          :items="glossaryItems"
          field="tagCategory"
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
  </NuxtLayout>
</template>
