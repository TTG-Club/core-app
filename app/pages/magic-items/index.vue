<script setup lang="ts">
  import { FilterControls } from '~filter/controls';
  import { MagicItemLegend } from '~magic-items/legend';
  import { MagicItemLink } from '~magic-items/link';
  import { PageGrid, PageResult } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { MagicItemLinkResponse } from '~magic-items/types';

  useSeoMeta({
    title: 'Магические предметы [Magic Items]',
    description: 'Магические предметы по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: magicItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'magic-items',
    () =>
      $fetch<Array<MagicItemLinkResponse>>('/api/v2/magic-item/search', {
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
    title="Магические предметы"
  >
    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <MagicItemLegend />
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
          v-else-if="status === 'success' && magicItems?.length"
          :columns="3"
        >
          <MagicItemLink
            v-for="magicItem in magicItems"
            :key="magicItem.url"
            :magic-item="magicItem"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="magicItems"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
