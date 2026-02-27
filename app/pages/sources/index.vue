<script setup lang="ts">
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import { SourceLink } from '~/features/sources/link';

  import type { SourceLinkResponse } from '~/features/sources/types';
  import type { SearchBody } from '~/shared/types';

  useSeoMeta({
    title: 'Источники [Sources]',
    description: 'Источники из D&D 5 (редакция 2024-2025 года).',
  });

  const search = ref<string>();

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('sources-filters', '/api/v2/source/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: sources,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'sources',
    () =>
      $fetch<Array<SourceLinkResponse>>('/api/v2/source/search', {
        method: 'POST',
        query: {
          query: search.value,
        },
        body: searchBody.value,
      }),
    {
      deep: false,
      watch: [search, filter],
    },
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Источники"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
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
          v-if="status !== 'success' && status !== 'error'"
          :columns="3"
        >
          <SkeletonLinkSmall
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <GroupedList
          v-else-if="status === 'success' && sources?.length"
          :items="sources"
          :group-by="(item) => item.source?.group?.rus ?? 'Без группы'"
          :separator-label="'{value}'"
        >
          <template #default="{ item }">
            <SourceLink
              :key="item.url"
              :source="item"
            />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="sources ?? []"
          :status="status"
          :error="error"
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
