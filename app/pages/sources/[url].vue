<script setup lang="ts">
  import { PageActions } from '~ui/page';
  import type { SourceDetailResponse } from '~sources/types';
  import { SourceBody } from '~sources/body';

  const route = useRoute();

  const { data: source } = await useAsyncData(
    `source-${route.params.url}`,
    () => $fetch<SourceDetailResponse>(`/api/v2/source/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (source.value ? source.value.source.name.rus : undefined),
    titleTemplate: '%s | Источники D&D 5 2024-2025',
  });

  function getSeoTitle() {
    if (!source.value) {
      return '';
    }

    return getSlicedString(source.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!source.value) {
      return '';
    }

    return getSlicedString(
      `${source.value.name.rus} [${source.value.name.eng}] — источник для D&D 5 (редакция 2024 года).`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/sources/${route.params.url}`);
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="source?.name.rus"
    :subtitle="source?.name.eng"
    :source="source?.source"
    :date-time="source?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        @close="navigateTo({ name: 'sources' })"
      />
    </template>

    <template #default>
      <SourceBody
        v-if="source"
        :source
      />

      <template v-else>
        <USkeleton
          v-for="index in 3"
          :key="index"
          :class="`w-1/${index + 1} h-6`"
        />
      </template>
    </template>
  </NuxtLayout>
</template>
