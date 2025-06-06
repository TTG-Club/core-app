<script setup lang="ts">
  import { getSlicedString } from '~/shared/utils';
  import { BackgroundBody } from '~backgrounds/body';
  import { PageActions, PageContainer, PageHeader } from '~ui/page';

  import type { BackgroundDetailResponse } from '~/shared/types';

  const route = useRoute();

  const { data: background } = await useAsyncData(
    `background-${route.params.url}`,
    () =>
      $fetch<BackgroundDetailResponse>(
        `/api/v2/backgrounds/${route.params.url}`,
      ),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () =>
      background.value ? background.value.source.name.rus : undefined,
    titleTemplate: '%s | Предыстории D&D 5 2024',
  });

  function getSeoTitle() {
    if (!background.value) {
      return '';
    }

    return getSlicedString(background.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!background.value) {
      return '';
    }

    return getSlicedString(
      `${background.value.name.rus} [${background.value.name.eng}] — предыстория D&D 5 2024 редакции`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/backgrounds/${route.params.url}`);
</script>

<template>
  <PageContainer>
    <template #header>
      <PageHeader
        :title="background?.name.rus"
        :subtitle="background?.name.eng"
        :source="background?.source"
        :date-time="background?.updatedAt"
        copy-title
      >
        <template #actions>
          <PageActions
            :edit-url="editUrl"
            @close="navigateTo({ name: 'backgrounds' })"
          />
        </template>
      </PageHeader>
    </template>

    <template #default>
      <BackgroundBody
        v-if="background"
        :background
      />

      <ASkeleton
        v-else
        :title="false"
        :paragraph="{ rows: 4 }"
      />
    </template>
  </PageContainer>
</template>
