<script setup lang="ts">
  import { FilterControls } from '~filter/controls';
  import { SpeciesLegend } from '~species/legend';
  import { SpeciesLink } from '~species/link';
  import { PageGrid, PageResult } from '~ui/page';

  import type { SpeciesLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Виды [Species]',
    description: 'Виды и происхождения персонажей по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const { data, status, error, refresh } = await useAsyncData(
    'species',
    () =>
      $fetch<Array<SpeciesLinkResponse>>('/api/v2/species/search', {
        method: 'post',
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
    title="Виды"
  >
    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <SpeciesLegend />
        </template>
      </FilterControls>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid
          v-if="status === 'success' && data?.length"
          :columns="5"
        >
          <SpeciesLink
            v-for="link in data"
            :key="link.url"
            :species="link"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="data"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
