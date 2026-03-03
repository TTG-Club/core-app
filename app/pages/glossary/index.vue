<script setup lang="ts">
  import { GlossaryLink } from '~glossary/link';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { GlossaryLinkResponse } from '~glossary/model';

  useSeoMeta({
    title: 'Глоссарий [Glossary]',
    description: 'Глоссарий из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    filterStringFromUrl,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('glossary', '/api/v2/glossary/filters');

  const {
    data: glossaryItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'glossary',
    () =>
      $fetch<Array<GlossaryLinkResponse>>('/api/v2/glossary', {
        method: 'GET',
        query: {
          search: search.value,
          filter: filterStringFromUrl.value,
        },
      }),
    {
      deep: false,
      watch: [search, filterStringFromUrl],
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
