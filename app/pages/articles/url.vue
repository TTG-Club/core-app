<script setup lang="ts">
  import { ArticlesBody } from '~/features/articles/body';
  import { PageActions } from '~ui/page';

  import type { ArticlesDetailResponse } from '~/features/articles/types';

  const route = useRoute();

  const { data: articles } = await useAsyncData(
    `articles-${route.params.url}`,
    () =>
      $fetch<ArticlesDetailResponse>(`/api/v2/articles/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (articles.value ? articles.value.source.name.rus : undefined),
    titleTemplate: '%s | Глоссарий D&D 5 2024',
  });

  function getSeoTitle() {
    if (!articles.value) {
      return '';
    }

    return getSlicedString(articles.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!articles.value) {
      return '';
    }

    return getSlicedString(
      `${articles.value.name.rus} [${articles.value.name.eng}] — ${articles.value.categories} D&D 5 2024 редакции`,
      160,
    );
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="articles?.name.rus"
    :subtitle="articles?.name.eng"
    :source="articles?.source"
    :date-time="articles?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions @close="navigateTo({ name: 'articles' })" />
    </template>

    <template #default>
      <ArticlesBody
        v-if="articles"
        :articles
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
