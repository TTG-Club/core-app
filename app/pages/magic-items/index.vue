<script setup lang="ts">
  import { computed } from 'vue';

  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { MagicItemLegend } from '~magic-items/legend';
  import { MagicItemLink } from '~magic-items/link';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import { useMagicItemRarityGroupOrder } from '~/shared/api/useMagicItemRarityGroupOrder';

  import type { MagicItemLinkResponse } from '~magic-items/types';

  useSeoMeta({
    title: 'Магические предметы [Magic Items]',
    description: 'Магические предметы из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    filterStringFromUrl,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('magic-items', '/api/v2/magic-items/filters');

  const { order: rarityOrder, pending: isRarityPending } =
    useMagicItemRarityGroupOrder();

  const {
    data: magicItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'magic-items',
    () =>
      $fetch<Array<MagicItemLinkResponse>>('/api/v2/magic-items', {
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

  const isLoading = computed(() => {
    const isItemsLoading =
      status.value !== 'success' && status.value !== 'error';

    return isItemsLoading || isRarityPending.value;
  });
</script>

<template>
  <NuxtLayout
    name="section"
    title="Магические предметы"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
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
          v-if="isLoading"
          :columns="3"
        >
          <SkeletonLinkSmall
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <GroupedList
          v-else-if="status === 'success' && magicItems?.length"
          :items="magicItems"
          field="rarity"
          :group-sort="{
            mode: 'custom',
            order: rarityOrder,
            unknown: 'after',
          }"
        >
          <template #default="{ item }">
            <MagicItemLink :magic-item="item" />
          </template>
        </GroupedList>

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
