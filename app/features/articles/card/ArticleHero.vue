<script setup lang="ts">
  import type { ArticleShortResponse } from '../model';

  import {
    getNewsCoverMeta,
    NEWS_COVER_ACTION_CLASS,
    UiNewsCover,
  } from '~ui/news-cover';
  import { getVideoPoster } from '~ui/video';

  import {
    ARTICLE_ADMIN_NEWS_LIST_LABEL,
    ARTICLE_CREATE_NEWS_LABEL,
    ARTICLE_DATE_FORMAT,
    ARTICLE_FALLBACK_IMAGE,
    ARTICLE_OPEN_PAGE_LABEL,
    ARTICLES_ADMIN_CREATE_ROUTE,
    ARTICLES_ADMIN_NEWS_ROUTE,
    getArticlePreviewText,
    getArticleRoute,
  } from '../model';

  const { article } = defineProps<{
    article: ArticleShortResponse;
  }>();

  defineEmits<{
    open: [];
    /** Ролик новости открыли или закрыли */
    video: [isOpen: boolean];
  }>();

  // Кнопку «Создать новость» показываем только администратору (см. useUserRoles).
  const { isAdmin } = useUserRoles();

  const { format } = useDayjs();

  // У записи с роликом обложка — его заставка (своя или превью площадки).
  const coverImage = computed(
    () =>
      getVideoPoster(article.videoUrl, article.previewImageUrl)
      ?? ARTICLE_FALLBACK_IMAGE,
  );

  const articleRoute = computed(() => getArticleRoute(article.url));

  // Над заголовком — тип записи и дата одной моноширинной строкой
  const meta = computed(() =>
    getNewsCoverMeta([
      article.typeName,
      article.publishDateTime
        ? format(article.publishDateTime, ARTICLE_DATE_FORMAT)
        : undefined,
    ]),
  );

  // Анонс короткого ответа приходит сырой JSON-строкой (`["текст"]`) — берём
  // читаемый plain-text через общий хелпер (разворачивает строку и убирает
  // {@...}-маркеры/markdown; иначе гостям видны скобки и кавычки).
  const previewText = computed(() => getArticlePreviewText(article.preview));
</script>

<template>
  <UiNewsCover
    :to="articleRoute"
    :title="article.title"
    :image="coverImage"
    :meta
    :preview="previewText"
    :video-url="article.videoUrl"
    @open="$emit('open')"
    @video="$emit('video', $event)"
  >
    <template #actions>
      <UButton
        v-if="isAdmin"
        :to="ARTICLES_ADMIN_CREATE_ROUTE"
        icon="tabler:plus"
        variant="ghost"
        size="sm"
        :class="NEWS_COVER_ACTION_CLASS"
        :aria-label="ARTICLE_CREATE_NEWS_LABEL"
      />

      <UButton
        v-if="isAdmin"
        :to="ARTICLES_ADMIN_NEWS_ROUTE"
        icon="tabler:list-details"
        variant="ghost"
        size="sm"
        :class="NEWS_COVER_ACTION_CLASS"
        :aria-label="ARTICLE_ADMIN_NEWS_LIST_LABEL"
      />

      <UButton
        :to="articleRoute"
        icon="tabler:external-link"
        variant="ghost"
        size="sm"
        :class="NEWS_COVER_ACTION_CLASS"
        :aria-label="ARTICLE_OPEN_PAGE_LABEL"
      />
    </template>
  </UiNewsCover>
</template>
