<script setup lang="ts">
  import type { ArticleDetailedResponse } from '../model';

  import { UiDetailLayout } from '~ui/detail-layout';
  import { UiGallery } from '~ui/gallery';
  import { getNodeText, MarkupRender, withHeadingAnchors } from '~ui/markup';
  import { RatingWidget } from '~ui/rating';

  import {
    ARTICLE_FALLBACK_IMAGE,
    ARTICLE_RATING_SECTION,
    ARTICLE_TOP_ANCHOR_ID,
    ARTICLE_TYPE,
    toArticleMarkup,
  } from '../model';
  import { ArticleTableOfContents } from '../toc';

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
  // хелпер).
  const previewNodes = computed(() => toArticleMarkup(article.preview));

  // Заголовки текста получают якоря и складываются в содержание под рейтингом.
  const anchoredContent = computed(() =>
    withHeadingAnchors(toArticleMarkup(article.content)),
  );

  const contentNodes = computed(() => anchoredContent.value.nodes);

  const headings = computed(() => anchoredContent.value.headings);

  const [DefineArticleTags, ArticleTags] = createReusableTemplate();

  // Анонс необязателен: если текста нет — не рендерим его блок, иначе пустой
  // flex-элемент оставляет призрачный отступ (gap) над содержанием.
  const hasPreview = computed(
    () => getNodeText(previewNodes.value).trim().length > 0,
  );
</script>

<template>
  <!-- Теги рисуются в двух местах (сбоку или над текстом) — разметка общая -->
  <DefineArticleTags>
    <div class="flex flex-wrap gap-1.5">
      <UBadge
        v-for="tag in article.tags"
        :key="tag"
        :label="tag"
        color="neutral"
        variant="soft"
        icon="tabler:tag"
      />
    </div>
  </DefineArticleTags>

  <!--
    Общая раскладка карточек: на широком контейнере картинка слева, весь текст
    справа; в узком дровере — в столбик. Один ArticleBody на чтение/дровер/предпросмотр.
  -->
  <article>
    <!-- Метка начала статьи для пункта содержания «На самый верх» -->
    <span
      :id="ARTICLE_TOP_ANCHOR_ID"
      class="block scroll-mt-4"
    />

    <UiDetailLayout>
      <template #aside>
        <!--
        Обложку открываем в лайтбоксе (как галереи классов/видов). Заглушку
        увеличивать нечего — она остаётся обычной картинкой без zoom-курсора.
      -->
        <!-- Растянута на высоту колонки, чтобы содержанию было где липнуть -->
        <div :class="[$style.cover, 'flex grow flex-col gap-4']">
          <!-- Рейтинг — компактной плашкой поверх нижнего края обложки -->
          <div class="relative">
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
              class="absolute bottom-2 left-2"
              size="compact"
              :section="ARTICLE_RATING_SECTION"
              :url="article.url"
            />
          </div>

          <!--
          Как навигация классов: липнет к верху колонки вместе с тегами под ним.
          В узкой раскладке (дровер, мобильные) содержание скрыто, а теги стоят
          над текстом — колонка там над ним, а не рядом.
        -->
          <div class="sticky top-0 flex flex-col gap-4">
            <ArticleTableOfContents
              v-if="headings.length"
              class="hidden lg:@min-3xl:block"
              :headings
            />

            <div
              v-if="article.tags.length"
              class="hidden @min-3xl:block"
            >
              <ArticleTags />
            </div>
          </div>
        </div>
      </template>

      <div class="flex flex-col">
        <div
          v-if="article.tags.length"
          class="mb-3 @min-3xl:hidden"
        >
          <ArticleTags />
        </div>

        <div
          v-if="hasPreview"
          class="text-lg text-toned"
        >
          <MarkupRender :render-node="previewNodes" />
        </div>

        <MarkupRender :render-node="contentNodes" />
      </div>
    </UiDetailLayout>
  </article>
</template>

<style module lang="scss">
  // Картинку внутри UiGallery пропом не достать — правим вложенный img
  // (модуль не scoped, селектор потомка работает). Для заглушки тот же набор
  // вешаем прямо на img через .coverImage.
  .coverImage,
  .cover img {
    aspect-ratio: 16 / 9;
    width: 100%;
    border-radius: 12px;
    object-fit: cover;
  }
</style>
