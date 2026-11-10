<script setup lang="ts">
  import type { CommunityNewsDetailedResponse } from '../model';

  import { toArticleMarkup } from '~articles/model';
  import { UiDetailLayout } from '~ui/detail-layout';
  import { UiGallery } from '~ui/gallery';
  import { getNodeText, MarkupRender } from '~ui/markup';
  import { UiVideoPlayer } from '~ui/video';

  import {
    COMMUNITY_NEWS_FALLBACK_IMAGE,
    COMMUNITY_NEWS_SOURCE_LABEL,
  } from '../model';

  /**
   * Чтение новости сообщества — общее для страницы, дровера, панели листинга
   * и предпросмотра. Раскладка та же, что у новостей сайта: на широком экране
   * обложка или ролик слева, текст справа; в узком — столбиком.
   */
  const { news } = defineProps<{
    news: CommunityNewsDetailedResponse;
  }>();

  const previewNodes = computed(() => toArticleMarkup(news.preview));

  const contentNodes = computed(() => toArticleMarkup(news.content));

  // Пустые блоки не рендерим: иначе остаётся призрачный отступ.
  const hasPreview = computed(
    () => getNodeText(previewNodes.value).trim().length > 0,
  );

  const hasContent = computed(
    () => getNodeText(contentNodes.value).trim().length > 0,
  );
</script>

<template>
  <article>
    <UiDetailLayout>
      <template #aside>
        <div :class="[$style.cover, 'flex flex-col gap-3']">
          <!-- Видео заменяет обложку; обложка становится его заставкой -->
          <UiVideoPlayer
            v-if="news.videoUrl"
            :url="news.videoUrl"
            :title="news.title"
            :poster="news.previewImageUrl ?? undefined"
          />

          <UiGallery
            v-else-if="news.previewImageUrl"
            :preview="news.previewImageUrl"
            :alt="news.title"
            disable-square
          />

          <img
            v-else
            :src="COMMUNITY_NEWS_FALLBACK_IMAGE"
            :alt="news.title"
            :class="$style.coverImage"
          />

          <div
            v-if="news.authorName || news.sourceUrl"
            class="flex flex-wrap items-center justify-between gap-2"
          >
            <span
              v-if="news.authorName"
              class="flex min-w-0 items-center gap-1.5 text-sm text-toned"
            >
              <UIcon
                name="tabler:user-circle"
                class="size-4 shrink-0 text-dimmed"
              />

              <span class="truncate">{{ news.authorName }}</span>
            </span>

            <UButton
              v-if="news.sourceUrl"
              :to="news.sourceUrl"
              target="_blank"
              rel="noopener noreferrer nofollow"
              icon="tabler:external-link"
              size="xs"
              color="neutral"
              variant="soft"
            >
              {{ COMMUNITY_NEWS_SOURCE_LABEL }}
            </UButton>
          </div>
        </div>
      </template>

      <!-- Строка не шире 65 знаков: длинный текст во всю ширину читать тяжело -->
      <div class="flex max-w-prose flex-col">
        <div
          v-if="hasPreview"
          class="text-lg text-toned"
        >
          <MarkupRender :render-node="previewNodes" />
        </div>

        <MarkupRender
          v-if="hasContent"
          :render-node="contentNodes"
        />
      </div>
    </UiDetailLayout>
  </article>
</template>

<style module lang="scss">
  // Картинку внутри UiGallery пропом не достать — правим вложенный img, как
  // у новостей сайта (ArticleBody). Заставку плеера правило не портит: она
  // и так растянута на всю его площадь.
  .coverImage,
  .cover img {
    aspect-ratio: 16 / 9;
    width: 100%;
    border-radius: 12px;
    object-fit: cover;
  }
</style>
