<script setup lang="ts">
  import { ClassLink } from '~classes/link';
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  import type { ClassLinkResponse } from '~classes/types';

  useSeoMeta({
    title: 'Классы [Classes]',
    description: 'Классы персонажей из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    filterStringFromUrl,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('classes', '/api/v2/classes/filters');

  const {
    data: classes,
    status,
    error,
    refresh,
  } = await useAsyncData(
    'classes',
    () =>
      $fetch<Array<ClassLinkResponse>>('/api/v2/classes', {
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
    title="Классы"
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
        <PageGrid v-if="status !== 'success' && status !== 'error'">
          <SkeletonLinkBig
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <PageGrid v-else-if="status === 'success' && classes?.length">
          <ClassLink
            v-for="link in classes"
            :key="link.url"
            :character-class="link"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="classes"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>
  </NuxtLayout>
</template>
