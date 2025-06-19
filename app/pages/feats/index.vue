<script setup lang="ts">
  import { FeatLegend } from '~feats/legend';
  import { FeatLink } from '~feats/link';
  import { FilterControls } from '~filter/controls';
  import { PageGrid, PageResult } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { FeatLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Черты [Feats]',
    description: 'Черты по D&D 2024 редакции',
  });

  const search = ref<string>('');

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
          query:
            search.value && search.value.length >= 3 ? search.value : undefined,
        },
      }),
    {
      deep: false,
      watch: [search],
    },
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Черты"
  >
    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <FeatLegend />
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
