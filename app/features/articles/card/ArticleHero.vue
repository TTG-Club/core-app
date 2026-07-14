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
  <div
    class="group relative flex min-h-44 cursor-pointer flex-col justify-end overflow-hidden rounded-none text-white no-underline sm:min-h-52"
    role="button"
    tabindex="0"
    @click="$emit('open')"
    @keydown.enter.prevent="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <img
      :src="coverImage"
      :alt="article.title"
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />

    <div
      class="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/20"
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

      <UButton
        :to="articleRoute"
        icon="tabler:external-link"
        variant="ghost"
        size="sm"
        :class="heroActionClass"
        :aria-label="`Открыть «${article.title}» на отдельной странице`"
        @click.stop
        @keydown.stop
      />
    </div>

    <div class="relative z-10 flex flex-col gap-1 p-4 sm:p-5">
      <span
        v-if="publishedAt"
        class="text-xs text-white/80"
      >
        {{ publishedAt }}
      </span>

      <h3
        class="line-clamp-2 text-lg leading-tight font-bold [text-shadow:0_2px_4px_#0000006e] sm:text-xl"
      >
        {{ article.title }}
      </h3>

      <p
        v-if="previewText"
        class="line-clamp-2 text-sm leading-snug text-white/85 [text-shadow:0_2px_4px_#0000006e]"
      >
        {{ previewText }}
      </p>
    </div>
  </div>
</template>
