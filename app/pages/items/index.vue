<script setup lang="ts">
  import { FilterControls } from '~filter/controls';
  import { ItemLink } from '~items/link';
  import { ItemLegend } from '~items/legend';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { ItemLinkResponse } from '~items/types';

  useSeoMeta({
    title: 'Предметы [Items]',
    description: 'Предметы из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>('');

  const {
    data: items,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'items',
    () =>
      $fetch<Array<ItemLinkResponse>>('/api/v2/item/search', {
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
    title="Предметы"
  >
    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <ItemLegend />
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
          v-else-if="status === 'success' && items?.length"
          :columns="3"
        >
          <ItemLink
            v-for="item in items"
            :key="item.url"
            :item="item"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="items"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
