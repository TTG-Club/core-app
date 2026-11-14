<script setup lang="ts">
  import type { CommunityNewsShortResponse } from '../model';

  import {
    getNewsCoverMeta,
    NEWS_COVER_ACTION_CLASS,
    UiNewsCover,
  } from '~ui/news-cover';
  import { getVideoPoster } from '~ui/video';

  import {
    COMMUNITY_NEWS_DATE_FORMAT,
    COMMUNITY_NEWS_FALLBACK_IMAGE,
    COMMUNITY_NEWS_OPEN_PAGE_LABEL,
    getCommunityNewsRoute,
  } from '../model';

  /** Новость сообщества малой обложкой — для узкой панели главной. */
  const { news } = defineProps<{
    news: CommunityNewsShortResponse;
  }>();

  defineEmits<{
    open: [];
    /** Ролик новости открыли или закрыли */
    video: [isOpen: boolean];
  }>();

  const { format } = useDayjs();

  // У новости с роликом обложка — его заставка (своя или превью площадки).
  const coverImage = computed(
    () =>
      getVideoPoster(news.videoUrl, news.previewImageUrl)
      ?? COMMUNITY_NEWS_FALLBACK_IMAGE,
  );

  const newsRoute = computed(() => getCommunityNewsRoute(news.url));

  // Над заголовком — автор и дата: у новостей сообщества важно, чья это
  // новость, а не только когда она вышла.
  const meta = computed(() =>
    getNewsCoverMeta([
      news.authorName,
      news.publishDateTime
        ? format(news.publishDateTime, COMMUNITY_NEWS_DATE_FORMAT)
        : undefined,
    ]),
  );
</script>

<template>
  <UiNewsCover
    :to="newsRoute"
    :title="news.title"
    :image="coverImage"
    :meta
    :video-url="news.videoUrl"
    compact
    @open="$emit('open')"
    @video="$emit('video', $event)"
  >
    <template #actions>
      <UButton
        :to="newsRoute"
        icon="tabler:external-link"
        variant="ghost"
        size="sm"
        :class="NEWS_COVER_ACTION_CLASS"
        :aria-label="COMMUNITY_NEWS_OPEN_PAGE_LABEL"
      />
    </template>
  </UiNewsCover>
</template>
