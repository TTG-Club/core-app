<script setup lang="ts">
  import { FilterControls } from '~filter/controls';
  import { GlossaryLegend } from '~glossary/legend';
  import { GlossaryLink } from '~glossary/link';
  import { PageGrid, PageResult } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { GlossaryLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Глоссарий [Glossary]',
    description: 'Глоссарий по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: glossaryItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'glossary',
    () =>
      $fetch<Array<GlossaryLinkResponse>>('/api/v2/glossary/search', {
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
    title="Глоссарий"
  >
    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <GlossaryLegend />
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
          v-else-if="status === 'success' && glossaryItems?.length"
          :columns="3"
        >
          <GlossaryLink
            v-for="item in glossaryItems"
            :key="item.url"
            :glossary="item"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="glossaryItems"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
