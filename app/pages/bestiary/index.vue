<script setup lang="ts">
  import { CreatureLink } from '~bestiary/link';
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { GroupedList } from '~ui/grouped-list';
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
    filterStringFromUrl,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('bestiary', '/api/v2/bestiary/filters');

  const {
    data: bestiary,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'bestiary',
    () =>
      $fetch<Array<CreatureLinkResponse>>('/api/v2/bestiary', {
        method: 'GET',
        query: {
          search: search.value,
          filter: filterStringFromUrl.value,
        },
      }),
    { deep: false, watch: [search, filterStringFromUrl] },
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
          v-else-if="status === 'success' && bestiary?.length"
          :items="bestiary"
          separator-label="Уровень опасности {value}"
          field="challengeRailing"
        >
          <template #default="{ item }">
            <CreatureLink :creature="item" />
          </template>
        </GroupedList>

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
