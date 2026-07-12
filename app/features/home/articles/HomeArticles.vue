<script setup lang="ts">
  import type { ArticleShortResponse } from '~articles/model';

  import { ArticleDrawer } from '~articles/drawer';
  import {
    ARTICLE_DATE_FORMAT,
    ARTICLE_FALLBACK_IMAGE,
    ARTICLE_TYPE,
    ARTICLES_ROUTE,
    ARTICLES_SEARCH_PATH,
    HOME_ARTICLES_COUNT,
  } from '~articles/model';

  // Клиентская (не-SSR) загрузка: блок статей ниже сгиба и не должен держать TTFB
  // главной в ожидании бэкенда (как HomeNews / HomeRecentChanges). Пока запрос идёт —
  // показываем скелетон, а не блокируем страницу.
  const { data, status, refresh } = await useAsyncData(
    'home-articles',
    () =>
      $fetch<ArticleShortResponse[]>(ARTICLES_SEARCH_PATH, {
        method: 'GET',
        query: {
          cnt: HOME_ARTICLES_COUNT,
          type: ARTICLE_TYPE.ARTICLE,
        },
      }),
    { default: () => [], lazy: true, server: false },
  );

  const hasArticles = computed(() => (data.value?.length ?? 0) > 0);

  // Главную часто держат открытой, а статьи публикуют/снимают в админке (нередко
  // в другой вкладке). Чтобы блок был актуальным без F5 — перезапрашиваем его при
  // возврате на вкладку (hidden → visible).
  const visibility = useDocumentVisibility();

  watch(visibility, (state, previous) => {
    if (state === 'visible' && previous === 'hidden') {
      refresh();
    }
  });

  const { format } = useDayjs();

  // Скелетон — только на ПЕРВОЙ загрузке (данных ещё нет); idle тоже держим как
  // loading (server:false: до клиентского фетча статус 'idle'). Фоновое обновление
  // не мигает скелетоном поверх уже показанных статей.
  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle')
      && !hasArticles.value,
  );

  // Блок прячем целиком, только если статьи ТАК И НЕ загрузились (бэкенд ещё не
  // включён и т.п.) — аккуратнее показать пустую главную, чем ошибку гостям.
  const isError = computed(
    () => status.value === 'error' && !hasArticles.value,
  );

  interface HomeArticleCard {
    id: string;
    url: string;
    title: string;
    date: string;
    cover: string;
  }

  const cards = computed<HomeArticleCard[]>(() =>
    (data.value ?? []).map((article) => ({
      id: article.id,
      url: article.url,
      title: article.title,
      date: article.publishDateTime
        ? format(article.publishDateTime, ARTICLE_DATE_FORMAT)
        : '',
      cover: article.previewImageUrl || ARTICLE_FALLBACK_IMAGE,
    })),
  );

  // По умолчанию статья открывается в дровере (страница остаётся доступной по
  // ссылке/ctrl+click). Паттерн как в HomeNews.
  const overlay = useOverlay();

  const articleDrawer = overlay.create(ArticleDrawer, {
    destroyOnClose: true,
    props: {
      url: '',
      onClose: () => articleDrawer.close(),
    },
  });

  function openArticle(url: string) {
    articleDrawer.open({ url });
  }
</script>

<template>
  <UCard
    v-if="!isError"
    :ui="{
      root: 'bg-muted',
      header: 'p-3 sm:p-3',
      body: 'p-0 sm:p-0',
    }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:article"
          class="size-5 text-primary"
        />

        <h3 class="text-base leading-none font-medium">Статьи</h3>
      </div>
    </template>

    <div
      v-if="isLoading"
      class="flex flex-col gap-3 p-3"
    >
      <div
        v-for="index in HOME_ARTICLES_COUNT"
        :key="index"
        class="flex items-center gap-3"
      >
        <USkeleton class="h-14 w-24 shrink-0 rounded-lg" />

        <div class="flex flex-1 flex-col gap-2">
          <USkeleton class="h-3 w-20 rounded-md" />

          <USkeleton class="h-4 w-3/4 rounded-md" />
        </div>
      </div>
    </div>

    <p
      v-else-if="!hasArticles"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      Статей пока нет
    </p>

    <div
      v-else
      class="flex flex-col"
    >
      <div class="flex flex-col gap-1 p-2">
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="group flex cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-elevated"
          @click.left.exact.prevent="openArticle(card.url)"
        >
          <img
            :src="card.cover"
            :alt="card.title"
            class="h-14 w-24 shrink-0 rounded-lg object-cover"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              v-if="card.date"
              class="text-xs leading-none text-muted"
            >
              {{ card.date }}
            </span>

            <h4
              class="line-clamp-2 text-sm leading-tight font-medium text-highlighted group-hover:text-primary"
            >
              {{ card.title }}
            </h4>
          </div>
        </button>
      </div>

      <UButton
        :to="ARTICLES_ROUTE"
        block
        size="lg"
        color="neutral"
        variant="soft"
        trailing-icon="tabler:arrow-right"
        class="justify-center rounded-none border-t border-default"
      >
        Все статьи
      </UButton>
    </div>
  </UCard>
</template>
