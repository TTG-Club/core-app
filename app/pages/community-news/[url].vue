<script setup lang="ts">
  import { getArticlePreviewText } from '~articles/model';
  import { ArticleReadingProgress } from '~articles/reading-progress';
  import { CommunityNewsBody } from '~community-news/body';
  import {
    COMMUNITY_NEWS_API_PATH,
    COMMUNITY_NEWS_DATE_FORMAT,
    COMMUNITY_NEWS_PAGE_TEXT,
    COMMUNITY_NEWS_ROUTE,
    COMMUNITY_NEWS_SEO_DESCRIPTION_LENGTH,
    getCommunityNewsEditRoute,
    getCommunityNewsMarkdown,
    parseCommunityNewsDetailed,
  } from '~community-news/model';
  import { PageActions } from '~ui/page';
  import { getVideoPoster } from '~ui/video';

  const route = useRoute();

  // Параметр маршрута может прийти массивом или пустым — берём только строку.
  const newsUrl = computed(() =>
    typeof route.params.url === 'string' && route.params.url
      ? route.params.url
      : '',
  );

  const { canPublishCommunityNews } = useUserRoles();

  const { data: news, error } = await useAsyncData(
    computed(() => `community-news-${newsUrl.value}`),
    async () =>
      parseCommunityNewsDetailed(
        await $fetch(`${COMMUNITY_NEWS_API_PATH}/${newsUrl.value}`),
      ),
  );

  // Опубликованной новости нет (черновик/снята/удалена/не существует) → 404.
  if (error.value || !news.value) {
    throw createError({
      statusCode: 404,
      statusMessage: COMMUNITY_NEWS_PAGE_TEXT.notFound,
      fatal: true,
    });
  }

  /** Описание для поисковиков: начало текста простым текстом, без него — заголовок. */
  function getSeoDescription(): string {
    if (!news.value) {
      return '';
    }

    const contentText = getArticlePreviewText(news.value.content).trim();

    return getSlicedString(
      contentText || news.value.title,
      COMMUNITY_NEWS_SEO_DESCRIPTION_LENGTH,
    );
  }

  useSeoMeta({
    title: () => news.value?.title ?? '',
    description: getSeoDescription,
    ogTitle: () => news.value?.title ?? '',
    ogDescription: getSeoDescription,
    ogImage: () =>
      getVideoPoster(news.value?.videoUrl, news.value?.previewImageUrl)
      ?? undefined,
    titleTemplate: '%s | TTG Club',
  });

  const markdown = useEntityMarkdown(news, getCommunityNewsMarkdown);

  const editUrl = computed(() =>
    canPublishCommunityNews.value && newsUrl.value
      ? getCommunityNewsEditRoute(newsUrl.value)
      : undefined,
  );
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="news?.title"
    :date-time="news?.publishDateTime"
    :date-time-format="COMMUNITY_NEWS_DATE_FORMAT"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        :close-url="COMMUNITY_NEWS_ROUTE"
        :markdown
      />
    </template>

    <template #default>
      <ArticleReadingProgress />

      <CommunityNewsBody
        v-if="news"
        :news
      />
    </template>
  </NuxtLayout>
</template>
