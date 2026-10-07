<script setup lang="ts">
  import type { ArticleShortResponse } from '../model';

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
    Кнопки действий лежат рядом со ссылкой-обложкой, а не внутри неё: ссылка
    внутри ссылки — невалидная разметка, и клик по кнопке пришлось бы глушить,
    чтобы он не открывал дровер.
  -->
  <div class="group relative overflow-hidden">
    <!--
      Обычный клик открывает дровер, ctrl+click и средняя кнопка — страницу
      записи (за это отвечает `.exact`). `custom` обязателен: у обычного
      NuxtLink собственный переход RouterLink срабатывает раньше нашего
      `.prevent`, и вместо дровера открывалась страница.
    -->
    <NuxtLink
      v-slot="{ href }"
      custom
      :to="articleRoute"
    >
      <a
        :href="href ?? undefined"
        class="relative block text-white no-underline"
        @click.left.exact.prevent="$emit('open')"
      >
        <img
          :src="coverImage"
          :alt="article.title"
          class="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-2/1 xl:aspect-21/9"
        />

        <div
          aria-hidden="true"
          class="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/5"
        />

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
      </a>
    </NuxtLink>

    <div class="absolute top-2 right-2 z-20 flex items-center gap-1">
      <UButton
        v-if="isAdmin"
        :to="ARTICLES_ADMIN_CREATE_ROUTE"
        icon="tabler:plus"
        variant="ghost"
        size="sm"
        :class="heroActionClass"
        :aria-label="ARTICLE_CREATE_NEWS_LABEL"
      />

      <UButton
        v-if="isAdmin"
        :to="ARTICLES_ADMIN_NEWS_ROUTE"
        icon="tabler:list-details"
        variant="ghost"
        size="sm"
        :class="heroActionClass"
        :aria-label="ARTICLE_ADMIN_NEWS_LIST_LABEL"
      />

      <UButton
        :to="articleRoute"
        icon="tabler:external-link"
        variant="ghost"
        size="sm"
        :class="heroActionClass"
        :aria-label="ARTICLE_OPEN_PAGE_LABEL"
      />
    </div>
  </div>
</template>
