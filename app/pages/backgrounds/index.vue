<script setup lang="ts">
  import { BackgroundLegend } from '~backgrounds/legend';
  import { BackgroundLink } from '~backgrounds/link';
  import { FilterControls } from '~filter/controls';
  import { PageGrid, PageResult } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { BackgroundLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Предыстории [Backgrounds]',
    description: 'Предыстории по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: backgrounds,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'backgrounds',
    () =>
      $fetch<Array<BackgroundLinkResponse>>('/api/v2/backgrounds/search', {
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
    title="Предыстории"
  >
    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <BackgroundLegend />
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
          v-else-if="status === 'success' && backgrounds?.length"
          :columns="3"
        >
          <BackgroundLink
            v-for="background in backgrounds"
            :key="background.url"
            :background="background"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="backgrounds"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
