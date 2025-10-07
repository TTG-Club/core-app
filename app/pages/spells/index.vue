<script setup lang="ts">
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { SpellLegend } from '~spells/legend';
  import { SpellLink } from '~spells/link';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { SearchBody, SpellLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Заклинания [Spells]',
    description: 'Заклинания из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('spells-filters', '/api/v2/spells/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: spells,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'spells',
    () =>
      $fetch<Array<SpellLinkResponse>>('/api/v2/spells/search', {
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
    title="Заклинания"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <SpellLegend />
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
          v-else-if="status === 'success' && spells?.length"
          :columns="3"
        >
          <SpellLink
            v-for="spell in spells"
            :key="spell.url"
            :spell="spell"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="spells"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
