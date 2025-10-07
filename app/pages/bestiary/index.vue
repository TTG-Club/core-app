<script setup lang="ts">
  import type { SearchBody } from '~/shared/types';
  import { CreatureLegend } from '~bestiary/legend';
  import { CreatureLink } from '~bestiary/link';
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { CreatureLinkResponse } from '~bestiary/types';

  useSeoMeta({
    title: 'Бестиарий [Bestiary]',
    description: 'Бестиарий из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('bestiary-filters', '/api/v2/bestiary/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: bestiary,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'bestiary',
    () =>
      $fetch<Array<CreatureLinkResponse>>('/api/v2/bestiary/search', {
        method: 'POST',
        params: {
          query: search.value,
        },
        body: searchBody.value,
      }),
    { deep: false, watch: [search, filter] },
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Бестиарий"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <CreatureLegend />
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
          v-else-if="status === 'success' && bestiary?.length"
          :columns="3"
        >
          <CreatureLink
            v-for="creature in bestiary"
            :key="creature.url"
            :creature
          />
        </PageGrid>

        <PageResult
          v-else
          :items="bestiary"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
