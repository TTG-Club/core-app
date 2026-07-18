<script setup lang="ts">
  import type { ArticleDetailedResponse } from '~articles/model';

  import { ArticleBody } from '~articles/body';
  import {
    ARTICLE_DATE_FORMAT,
    ARTICLE_TYPE,
    ARTICLES_ADMIN_ROUTE,
    ARTICLES_API_PATH,
    ARTICLES_ROUTE,
    getArticlePreviewText,
    NEWS_ROUTE,
  } from '~articles/model';
  import { PageActions } from '~ui/page';

  const route = useRoute();
  const { isAdmin } = useUserRoles();

  const { data: article, error } = await useAsyncData(
    `article-${route.params.url}`,
    () =>
      $fetch<ArticleDetailedResponse>(
        `${ARTICLES_API_PATH}/${route.params.url}`,
      ),
  );

  // Опубликованной записи нет (черновик/отложено/удалено/не существует) → 404.
  if (error.value || !article.value) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Запись не найдена',
      fatal: true,
    });
  }

  function getSeoDescription(): string {
    if (!article.value) {
      return '';
    }

    const previewText = getArticlePreviewText(article.value.preview).trim();

    return getSlicedString(previewText || article.value.title, 160);
  }

  useSeoMeta({
    title: () => article.value?.title ?? '',
    description: getSeoDescription,
    ogTitle: () => article.value?.title ?? '',
    ogDescription: getSeoDescription,
    ogImage: () => article.value?.previewImageUrl ?? undefined,
    titleTemplate: '%s | TTG Club',
  });

  const editUrl = computed(() =>
    isAdmin.value ? `${ARTICLES_ADMIN_ROUTE}/${route.params.url}` : undefined,
  );

  // Возврат — в листинг соответствующего типа (новости → /news, статьи → /articles).
  const closeUrl = computed(() =>
    article.value?.type === ARTICLE_TYPE.NEWS ? NEWS_ROUTE : ARTICLES_ROUTE,
  );
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="article?.title"
    :date-time="article?.publishDateTime"
    :date-time-format="ARTICLE_DATE_FORMAT"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        :close-url="closeUrl"
      />
    </template>

    <!-- Блок комментариев вставляет layout detail — общий для всех разделов -->
    <template #default>
      <ArticleBody
        v-if="article"
        :article
      />
    </template>
  </NuxtLayout>
</template>
