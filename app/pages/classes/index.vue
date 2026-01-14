<script setup lang="ts">
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { ClassLink } from '~classes/link';
  import { PageGrid, PageResult } from '~ui/page';

  import type { SearchBody } from '~/shared/types';
  import type { ClassLinkResponse } from '~classes/types';
  import { SkeletonLinkBig } from '~ui/skeleton';

  useSeoMeta({
    title: 'Классы [Classes]',
    description: 'Классы персонажей из D&D 5 (редакция 2024 года).',
  });

  const search = ref<string>();

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('classes', '/api/v2/classes/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: classes,
    status,
    error,
    refresh,
  } = await useAsyncData(
    'classes',
    () =>
      $fetch<Array<ClassLinkResponse>>('/api/v2/classes/search', {
        method: 'post',
        params: {
          query: search.value,
        },
        body: searchBody.value,
      }),
    {
      deep: false,
      watch: [search, filter],
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
