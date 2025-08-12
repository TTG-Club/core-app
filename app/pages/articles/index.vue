<script setup lang="ts">
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { ArticlesLegend } from '~/features/articles/legend';
  import { ArticlesLink } from '~/features/articles/link';
  import { PageGrid, PageResult } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { ArticlesLinkResponse } from '~/features/articles/types/link';
  import type { SearchBody } from '~/shared/types';

  useSeoMeta({
    title: 'Статьйи [Articles]',
    description: 'Статьйи по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('articles-filters', '/api/v2/articles/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: articlesItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'articles',
    () =>
      $fetch<Array<ArticlesLinkResponse>>('/api/v2/articles/search', {
        method: 'POST',
        params: {
          query:
            search.value && search.value.length >= 3 ? search.value : undefined,
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
    title="Статьйи"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <ArticlesLegend />
        </template>
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
          <SmallLinkSkeleton
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <PageGrid
          v-else-if="status === 'success' && articlesItems?.length"
          :columns="3"
        >
          <ArticlesLink
            v-for="item in articlesItems"
            :key="item.url"
            :articles="item"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="articlesItems"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
