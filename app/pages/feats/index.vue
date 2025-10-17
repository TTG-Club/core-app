<script setup lang="ts">
  import { FeatLink } from '~feats/link';
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { FeatLinkResponse, SearchBody } from '~/shared/types';

  useSeoMeta({
    title: 'Черты [Feats]',
    description: 'Черты из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('feats-filters', '/api/v2/feats/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: feats,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'feats',
    () =>
      $fetch<Array<FeatLinkResponse>>('/api/v2/feats/search', {
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
    title="Черты"
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

        <PageGrid
          v-else-if="status === 'success' && feats?.length"
          :columns="3"
        >
          <FeatLink
            v-for="feat in feats"
            :key="feat.url"
            :feat="feat"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="feats"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
