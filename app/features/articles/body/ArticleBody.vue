<script setup lang="ts">
  import type { RenderNode } from '~ui/markup';

  import type { ArticleDetailedResponse } from '../model';

  import { UiGallery } from '~ui/gallery';
  import { getNodeText, MarkupRender } from '~ui/markup';
  import { RatingWidget } from '~ui/rating';

  import {
    ARTICLE_FALLBACK_IMAGE,
    ARTICLE_RATING_SECTION,
    ARTICLE_TYPE,
    toArticleMarkup,
  } from '../model';

  const { article, hideRating = false } = defineProps<{
    article: ArticleDetailedResponse;
    /** Скрыть рейтинг — для предпросмотра в редакторе, где записи ещё нет на сайте. */
    hideRating?: boolean;
  }>();

  // Рейтинг — только у статей (как у существ в бестиарии); новостям он ни к чему.
  const isRatingShown = computed(
    () => !hideRating && article.type === ARTICLE_TYPE.ARTICLE,
  );

  // toArticleMarkup разворачивает возможную сырую JSON-строку описания в узлы (см.
  // хелпер). Каст к RenderNode безопасен в рантайме: parse() возвращает плоский
  // массив узлов, который MarkupRender корректно принимает как «несколько записей».
  const previewNodes = computed(
    () => toArticleMarkup(article.preview) as RenderNode,
  );

  const contentNodes = computed(
    () => toArticleMarkup(article.content) as RenderNode,
  );

  // Анонс необязателен: если текста нет — не рендерим его блок, иначе пустой
  // flex-элемент оставляет призрачный отступ (gap) над содержанием.
  const hasPreview = computed(
    () => getNodeText(previewNodes.value).trim().length > 0,
  );
</script>

<template>
  <!--
    Раскладка привязана к ширине КОНТЕЙНЕРА (как в SpellBody/CreatureBody), а не
    окна: на широкой странице (>800px) картинка слева, весь текст справа; в узком
    дровере (~672px) — в столбик. Один ArticleBody на чтение/дровер/предпросмотр.
  -->
  <article :class="$style.container">
    <div :class="$style.body">
      <!--
        Обложку открываем в лайтбоксе (как галереи классов/видов). Заглушку
        увеличивать нечего — она остаётся обычной картинкой без zoom-курсора.
      -->
      <div :class="[$style.cover, 'flex flex-col gap-4']">
        <UiGallery
          v-if="article.previewImageUrl"
          :preview="article.previewImageUrl"
          :alt="article.title"
          disable-square
        />

        <img
          v-else
          :src="ARTICLE_FALLBACK_IMAGE"
          :alt="article.title"
          :class="$style.coverImage"
        />

        <RatingWidget
          v-if="isRatingShown"
          :section="ARTICLE_RATING_SECTION"
          :url="article.url"
        />
      </div>

      <div :class="$style.text">
        <div
          v-if="article.tags.length"
          class="mb-3 flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="tag in article.tags"
            :key="tag"
            :label="tag"
            color="neutral"
            variant="soft"
            icon="tabler:tag"
          />
        </div>

        <div
          v-if="hasPreview"
          class="text-lg text-toned"
        >
          <MarkupRender :render-node="previewNodes" />
        </div>

        <MarkupRender :render-node="contentNodes" />
      </div>
    </div>
  </article>
</template>

<style module lang="scss">
  .container {
    container-type: inline-size;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 16px;

    @container (width > 800px) {
      flex-direction: row;
      gap: 24px;
      align-items: flex-start;
    }
  }

  .cover {
    width: 100%;

    @container (width > 800px) {
      flex-shrink: 0;
      width: 320px;
    }
  }

  // Картинку внутри UiGallery пропом не достать — правим вложенный <img>
  // (модуль не scoped, селектор потомка работает). Для заглушки тот же набор
  // вешаем прямо на <img> через .coverImage.
  .coverImage,
  .cover img {
    aspect-ratio: 16 / 9;
    width: 100%;
    border-radius: 12px;
    object-fit: cover;
  }

  .text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
  }
</style>
