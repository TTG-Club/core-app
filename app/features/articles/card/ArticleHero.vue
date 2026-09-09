<script setup lang="ts">
  import type { ArticleShortResponse } from '../model';

  import {
    ARTICLE_DATE_FORMAT,
    ARTICLE_FALLBACK_IMAGE,
    ARTICLES_ADMIN_CREATE_ROUTE,
    ARTICLES_ADMIN_NEWS_ROUTE,
    getArticlePreviewText,
    getArticleRoute,
  } from '../model';

  const { article } = defineProps<{
    article: ArticleShortResponse;
  }>();

  defineEmits<{
    (e: 'open'): void;
  }>();

  // Кнопку «Создать новость» показываем только администратору (см. useUserRoles).
  const { isAdmin } = useUserRoles();

  const { format } = useDayjs();

  // Общий вид кнопок-действий поверх обложки (стеклянный тёмный фон).
  const heroActionClass =
    'bg-black/40 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/60 hover:text-white';

  const coverImage = computed(
    () => article.previewImageUrl || ARTICLE_FALLBACK_IMAGE,
  );

  const articleRoute = computed(() => getArticleRoute(article.url));

  const publishedAt = computed(() =>
    article.publishDateTime
      ? format(article.publishDateTime, ARTICLE_DATE_FORMAT)
      : '',
  );

  // Анонс короткого ответа приходит сырой JSON-строкой (`["текст"]`) — берём
  // читаемый plain-text через общий хелпер (разворачивает строку и убирает
  // {@...}-маркеры/markdown; иначе гостям видны скобки и кавычки).
  const previewText = computed(() => getArticlePreviewText(article.preview));
</script>

<template>
  <!--
    Обложка-ссылка: обычный клик открывает дровер (страница остаётся под
    ctrl+click и средней кнопкой — за это отвечает `.exact`), поэтому отдельная
    кнопка «открыть страницу» нужна только админам рядом с их действиями.
  -->
  <NuxtLink
    :to="articleRoute"
    class="group relative block overflow-hidden text-white no-underline"
    @click.left.exact.prevent="$emit('open')"
  >
    <img
      :src="coverImage"
      :alt="article.title"
      class="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-2/1 xl:aspect-21/9"
    />

    <div
      aria-hidden="true"
      class="absolute inset-0 bg-linear-to-t from-black/92 via-black/55 to-black/10"
    />

    <div class="absolute top-2 right-2 z-20 flex items-center gap-1">
      <UButton
        v-if="isAdmin"
        :to="ARTICLES_ADMIN_CREATE_ROUTE"
        icon="tabler:plus"
        variant="ghost"
        size="sm"
        :class="heroActionClass"
        aria-label="Создать новость"
        @click.stop
        @keydown.stop
      />

      <UButton
        v-if="isAdmin"
        :to="ARTICLES_ADMIN_NEWS_ROUTE"
        icon="tabler:list-details"
        variant="ghost"
        size="sm"
        :class="heroActionClass"
        aria-label="Список новостей в админ-панели"
        @click.stop
        @keydown.stop
      />
    </div>

    <div
      class="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-4 sm:p-6"
    >
      <span
        class="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] leading-none tracking-[0.16em] text-white/70 uppercase"
      >
        {{ article.typeName }}

        <template v-if="publishedAt">
          <span
            aria-hidden="true"
            class="text-white/40"
          >
            ·
          </span>

          {{ publishedAt }}
        </template>
      </span>

      <h3
        class="line-clamp-2 text-xl leading-tight font-semibold text-balance [text-shadow:0_2px_8px_#000000a0] sm:text-2xl xl:text-3xl"
      >
        {{ article.title }}
      </h3>

      <p
        v-if="previewText"
        class="line-clamp-2 max-w-3xl text-sm leading-snug text-white/80 [text-shadow:0_2px_6px_#00000090] sm:text-base"
      >
        {{ previewText }}
      </p>
    </div>
  </NuxtLink>
</template>
