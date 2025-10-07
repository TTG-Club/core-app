<script setup lang="ts">
  import { BackgroundLegend } from '~backgrounds/legend';
  import { BackgroundLink } from '~backgrounds/link';
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { BackgroundLinkResponse, SearchBody } from '~/shared/types';

  useSeoMeta({
    title: 'Предыстории [Backgrounds]',
    description: 'Предыстории из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('backgrounds-filters', '/api/v2/backgrounds/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: backgrounds,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'backgrounds',
    () =>
      $fetch<Array<BackgroundLinkResponse>>('/api/v2/backgrounds/search', {
        method: 'POST',
        params: {
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
    title="Предыстории"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <BackgroundLegend />
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
          <SkeletonLinkSmall
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <PageGrid
          v-else-if="status === 'success' && backgrounds?.length"
          :columns="3"
        >
          <BackgroundLink
            v-for="background in backgrounds"
            :key="background.url"
            :background="background"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="backgrounds"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
