<script setup lang="ts">
  import type { CommunityNewsShortResponse } from '../model';

  import { getVideoPoster, VIDEO_PLAY_ICON } from '~ui/video';

  import {
    COMMUNITY_NEWS_DATE_FORMAT,
    COMMUNITY_NEWS_FALLBACK_IMAGE,
    getCommunityNewsRoute,
  } from '../model';

  const { news } = defineProps<{
    news: CommunityNewsShortResponse;
  }>();

  defineEmits<{
    (e: 'open'): void;
  }>();

  const { format } = useDayjs();

  // У новости с роликом обложка — его заставка (своя или превью площадки).
  const coverImage = computed(
    () =>
      getVideoPoster(news.videoUrl, news.previewImageUrl)
      ?? COMMUNITY_NEWS_FALLBACK_IMAGE,
  );

  const newsRoute = computed(() => getCommunityNewsRoute(news.url));

  // Над заголовком — автор и дата одной моноширинной строкой: у новостей
  // сообщества важно, чья это новость, а не только когда она вышла.
  const meta = computed(() =>
    [
      news.authorName,
      news.publishDateTime
        ? format(news.publishDateTime, COMMUNITY_NEWS_DATE_FORMAT)
        : '',
    ]
      .filter(Boolean)
      .join(' · '),
  );
</script>

<template>
  <!--
    Строка ленты, как у новостей сайта: обложка слева, подпись и заголовок.
    Обычный клик открывает дровер, ctrl+click и средняя кнопка — страницу
    (`.exact`). `custom` обязателен: иначе переход RouterLink срабатывает
    раньше нашего `.prevent`.
  -->
  <NuxtLink
    v-slot="{ href }"
    custom
    :to="newsRoute"
  >
    <a
      :href="href ?? undefined"
      class="group flex min-w-0 items-center gap-3 rounded-lg p-2 no-underline transition-colors hover:bg-elevated"
      @click.left.exact.prevent="$emit('open')"
    >
      <span class="relative h-16 w-24 shrink-0 overflow-hidden rounded-md">
        <img
          :src="coverImage"
          :alt="news.title"
          loading="lazy"
          class="size-full object-cover"
        />

        <span
          v-if="news.videoUrl"
          aria-hidden="true"
          class="absolute inset-0 flex items-center justify-center bg-black/25"
        >
          <span
            class="flex size-7 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/30"
          >
            <UIcon
              :name="VIDEO_PLAY_ICON"
              class="size-3.5"
            />
          </span>
        </span>
      </span>

      <span class="flex min-w-0 flex-1 flex-col gap-1">
        <span
          v-if="meta"
          class="truncate font-mono text-[10px] leading-none tracking-[0.14em] text-dimmed uppercase"
        >
          {{ meta }}
        </span>

        <span
          class="line-clamp-2 text-sm leading-snug font-medium text-highlighted transition-colors group-hover:text-primary"
        >
          {{ news.title }}
        </span>
      </span>
    </a>
  </NuxtLink>
</template>
