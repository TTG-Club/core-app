<script setup lang="ts">
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { SpellLegend } from '~spells/legend';
  import { SpellLink } from '~spells/link';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import type { SpellLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Заклинания [Spells]',
    description: 'Заклинания из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    filterStringFromUrl,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('spells', '/api/v2/spells/filters');

  const {
    data: spells,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'spells',
    () =>
      $fetch<Array<SpellLinkResponse>>('/api/v2/spells', {
        method: 'GET',
        query: {
          query: search.value,
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

        <GroupedList
          v-else-if="status === 'success' && spells?.length"
          :items="spells"
          :separator-label="
            (value) => (!value ? 'Заговоры' : 'Уровень {value}')
          "
          field="level"
        >
          <template #default="{ item }">
            <SpellLink :spell="item" />
          </template>
        </GroupedList>

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
