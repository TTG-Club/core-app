<script setup lang="ts">
  import { getSlicedString } from '~/shared/utils';
  import { BeastBody } from '~bestiary/body';
  import { PageActions, PageContainer, PageHeader } from '~ui/page';

  import type { BeastDetailResponse } from '~bestiary/types';

  const route = useRoute();

  const { data: bestiary } = await useAsyncData(
    `bestiary-${route.params.url}`,
    () => $fetch<BeastDetailResponse>(`/api/v2/bestiary/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (bestiary.value ? bestiary.value.source.name.rus : undefined),
    titleTemplate: '%s | Бестиарий D&D 5 2025',
  });

  function getSeoTitle() {
    if (!bestiary.value) {
      return '';
    }

    return getSlicedString(bestiary.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!bestiary.value) {
      return '';
    }

    return getSlicedString(
      `${bestiary.value.name.rus} [${bestiary.value.name.eng}] D&D 5 2024 редакции`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/bestiary/${route.params.url}`);
</script>

<template>
  <PageContainer>
    <template #header>
      <PageHeader
        :title="bestiary?.name.rus"
        :subtitle="bestiary?.name.eng"
        :source="bestiary?.source"
        :date-time="bestiary?.updatedAt"
        copy-title
      >
        <template #actions>
          <PageActions
            :edit-url="editUrl"
            @close="navigateTo({ name: 'magic-items' })"
          />
        </template>
      </PageHeader>
    </template>

    <template #default>
      <BeastBody
        v-if="bestiary"
        :bestiary
      />

      <ASkeleton
        v-else
        :title="false"
        :paragraph="{ rows: 4 }"
      />
    </template>
  </PageContainer>
</template>
