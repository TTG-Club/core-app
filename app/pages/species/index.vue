<script setup lang="ts">
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { SpeciesLegend } from '~species/legend';
  import { SpeciesLink } from '~species/link';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  import type { SearchBody, SpeciesLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Виды [Species]',
    description:
      'Виды и происхождения персонажей из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('species-filters', '/api/v2/species/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const { data, status, error, refresh } = await useAsyncData(
    'species',
    () =>
      $fetch<Array<SpeciesLinkResponse>>('/api/v2/species/search', {
        method: 'post',
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
    title="Виды"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <SpeciesLegend />
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
          :columns="5"
        >
          <SkeletonLinkBig
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <PageGrid
          v-else-if="status === 'success' && data?.length"
          :columns="5"
        >
          <SpeciesLink
            v-for="link in data"
            :key="link.url"
            :species="link"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="data"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
