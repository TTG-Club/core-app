<script setup lang="ts">
  import type { SearchBody } from '~/shared/types';
  import type { SourceLinkResponse } from '~sources/types';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { SourceLink } from '~sources/link';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

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
          <SkeletonLinkBig
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <GroupedList
          v-else-if="status === 'success' && sources?.length"
          :separator-label="(value) => (!value ? 'Без группы' : String(value))"
          :items="sources"
          :columns="3"
          field="source.group.rus"
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
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
