<script setup lang="ts">
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { ItemLink } from '~items/link';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { ItemLinkResponse } from '~items/types';

  useSeoMeta({
    title: 'Предметы [Items]',
    description: 'Предметы из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    filterStringFromUrl,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('items', '/api/v2/item/filters');

  const {
    data: items,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'items',
    () =>
      $fetch<Array<ItemLinkResponse>>('/api/v2/item', {
        method: 'GET',
        query: {
          search: search.value,
          filter: filterStringFromUrl.value,
        },
      }),
    {
      deep: false,
      watch: [search, filterStringFromUrl],
    },
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Предметы"
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

        <GroupedList
          v-else-if="status === 'success' && items?.length"
          :items="items"
        >
          <template #default="{ item }">
            <ItemLink :item="item" />
          </template>
        </GroupedList>

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
