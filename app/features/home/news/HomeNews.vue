<script setup lang="ts">
  import type { ArticleShortResponse } from '~articles/model';

  import { ArticleHero, ArticleTile } from '~articles/card';
  import { ArticleDrawer } from '~articles/drawer';
  import {
    ARTICLE_TYPE,
    ARTICLES_SEARCH_PATH,
    HOME_NEWS_COUNT,
    NEWS_ROUTE,
  } from '~articles/model';
  import { HomePanel } from '~home/ui-kit';

  import {
    HOME_NEWS_ALL_LABEL,
    HOME_NEWS_EMPTY_TEXT,
    HOME_NEWS_ICON,
    HOME_NEWS_LABEL,
  } from './model';

  // Клиентская (не-SSR) загрузка: блок новостей ниже сгиба и не должен держать
  // TTFB главной в ожидании бэкенда статей (как HomeRecentChanges). Пока запрос
  // идёт — показываем скелетон, а не блокируем страницу.
  const { data, status, refresh } = await useAsyncData(
    'home-news',
    () =>
      $fetch<ArticleShortResponse[]>(ARTICLES_SEARCH_PATH, {
        method: 'GET',
        query: {
          cnt: HOME_NEWS_COUNT,
          type: ARTICLE_TYPE.NEWS,
        },
      }),
    { default: () => [], lazy: true, server: false },
  );

  const hasNews = computed(() => (data.value?.length ?? 0) > 0);

  // Главную часто держат открытой, а новости публикуют/снимают в админке (нередко
  // в другой вкладке). Чтобы блок был актуальным без F5 — перезапрашиваем его при
  // возврате на вкладку (hidden → visible). Навигация на главную и так тянет свежее.
  const visibility = useDocumentVisibility();

  watch(visibility, (state, previous) => {
    if (state === 'visible' && previous === 'hidden') {
      refresh();
    }
  });

  // Скелетон — только на ПЕРВОЙ загрузке (данных ещё нет); idle тоже держим как
  // loading (server:false: до клиентского фетча статус 'idle'). Фоновое обновление
  // при возврате на вкладку не мигает скелетоном поверх уже показанных новостей.
  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle') && !hasNews.value,
  );

  // Блок прячем целиком, только если новости ТАК И НЕ загрузились (бэкенд ещё не
  // включён и т.п.) — аккуратнее показать пустую главную, чем ошибку гостям. Если же
  // данные есть, а фоновое обновление упало — оставляем показанное, не роняем блок.
  const isError = computed(() => status.value === 'error' && !hasNews.value);

  const heroArticle = computed(() => data.value?.[0] ?? null);

  /** Остальные новости после «геройской» — компактной сеткой плиток */
  const restArticles = computed(() => (data.value ?? []).slice(1));

  // По умолчанию новость открывается в дровере (страница остаётся доступной
  // по ссылке/ctrl+click и по кнопке «открыть на отдельной странице»).
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
  <HomePanel
    v-if="!isError"
    :label="HOME_NEWS_LABEL"
    :icon="HOME_NEWS_ICON"
    :to="NEWS_ROUTE"
    :link-label="HOME_NEWS_ALL_LABEL"
    body-class="p-0"
  >
    <div
      v-if="isLoading"
      class="flex flex-col"
    >
      <USkeleton
        class="aspect-16/10 w-full rounded-none sm:aspect-2/1 xl:aspect-21/9"
      />

      <div class="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
        <div
          v-for="index in 4"
          :key="index"
          class="flex items-center gap-3 p-2"
        >
          <USkeleton class="h-16 w-24 shrink-0 rounded-md" />

          <div class="flex flex-1 flex-col gap-2">
            <USkeleton class="h-2.5 w-16 rounded" />

            <USkeleton class="h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>
    </div>

    <p
      v-else-if="!hasNews"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_NEWS_EMPTY_TEXT }}
    </p>

    <div
      v-else
      class="flex flex-col"
    >
      <ArticleHero
        v-if="heroArticle"
        :article="heroArticle"
        @open="openArticle(heroArticle.url)"
      />

      <div
        v-if="restArticles.length"
        class="grid grid-cols-1 gap-1 border-t border-default p-2 sm:grid-cols-2"
      >
        <ArticleTile
          v-for="article in restArticles"
          :key="article.id"
          :article
          @open="openArticle(article.url)"
        />
      </div>
    </div>
  </HomePanel>
</template>
