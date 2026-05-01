<script setup lang="ts">
  import type { SearchBody } from '~/shared/types';
  import type { SourceLinkResponse } from '~sources/types';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { SourceLink } from '~sources/link';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  useSeoMeta({
    title: 'Источники [Sources]',
    description: 'Источники из D&D 5 (редакция 2024-2025 года).',
  });

  const {
    filter,
    search,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    defaults: filterDefaults,
  } = await useFilter('sources-filters', '/api/v2/source/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter.value && Object.keys(filter.value).length) {
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

  interface SourceGroup {
    label: string;
    rus: string;
    items: Array<SourceLinkResponse>;
  }

  const groupedSources = computed<Array<SourceGroup>>(() => {
    if (!sources.value?.length) {
      return [];
    }

    const groupMap = new Map<string, SourceGroup>();

    for (const source of sources.value) {
      const groupKey = source.source.group.label;
      const existing = groupMap.get(groupKey);

      if (existing) {
        existing.items.push(source);
      } else {
        groupMap.set(groupKey, {
          label: groupKey,
          rus: source.source.group.rus,
          items: [source],
        });
      }
    }

    return Array.from(groupMap.values());
  });
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
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      />
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid v-if="status !== 'success' && status !== 'error'">
          <SkeletonLinkBig
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <div
          v-else-if="status === 'success' && sources?.length"
          class="flex flex-col gap-6"
        >
          <div
            v-for="group in groupedSources"
            :key="group.label"
            class="flex flex-col gap-4"
          >
            <USeparator>{{ group.rus }}</USeparator>

            <PageGrid>
              <SourceLink
                v-for="source in group.items"
                :key="source.url"
                :source="source"
              />
            </PageGrid>
          </div>
        </div>

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
