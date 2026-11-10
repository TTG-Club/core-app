<script setup lang="ts">
  import type { ArticleShortResponse } from '../model';

  import { getVideoPoster, VIDEO_PLAY_ICON } from '~ui/video';

  import {
    ARTICLE_DATE_FORMAT,
    ARTICLE_FALLBACK_IMAGE,
    getArticleRoute,
  } from '../model';

  const { article } = defineProps<{
    article: ArticleShortResponse;
  }>();

  defineEmits<{
    (e: 'open'): void;
  }>();

  const { format } = useDayjs();

  // У записи с роликом обложка — его заставка (своя или превью площадки).
  const coverImage = computed(
    () =>
      getVideoPoster(article.videoUrl, article.previewImageUrl)
      ?? ARTICLE_FALLBACK_IMAGE,
  );

  const articleRoute = computed(() => getArticleRoute(article.url));

  const publishedAt = computed(() =>
    article.publishDateTime
      ? format(article.publishDateTime, ARTICLE_DATE_FORMAT)
      : '',
  );
</script>

<template>
  <!--
    Компактная строка ленты: обложка слева, дата моноширинным капсом и заголовок
    в две строки. Обычный клик открывает дровер, ctrl+click и средняя кнопка —
    страницу записи (за это отвечает `.exact` на обработчике). `custom`
    обязателен: у обычного NuxtLink собственный переход RouterLink срабатывает
    раньше нашего `.prevent`, и вместо дровера открывалась страница.
  -->
  <NuxtLink
    v-slot="{ href }"
    custom
    :to="articleRoute"
  >
    <a
      :href="href ?? undefined"
      class="group flex min-w-0 items-center gap-3 rounded-lg p-2 no-underline transition-colors hover:bg-elevated"
      @click.left.exact.prevent="$emit('open')"
    >
      <span class="relative h-16 w-24 shrink-0 overflow-hidden rounded-md">
        <img
          :src="coverImage"
          :alt="article.title"
          loading="lazy"
          class="size-full object-cover"
        />

        <!-- Значок ролика: запись с видео видно ещё в ленте -->
        <span
          v-if="article.videoUrl"
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

      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <span
          v-if="publishedAt"
          class="font-mono text-[10px] leading-none tracking-[0.14em] text-dimmed uppercase"
        >
          {{ publishedAt }}
        </span>

        <h4
          class="line-clamp-2 text-sm leading-snug font-medium text-highlighted transition-colors group-hover:text-primary"
        >
          {{ article.title }}
        </h4>
      </div>
    </a>
  </NuxtLink>
</template>
