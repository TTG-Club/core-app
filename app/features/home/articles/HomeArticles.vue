<script setup lang="ts">
  import type { ArticleShortResponse } from '~articles/model';

  import { ArticleTile } from '~articles/card';
  import { ArticleDrawer } from '~articles/drawer';
  import {
    ARTICLE_TYPE,
    ARTICLES_ROUTE,
    ARTICLES_SEARCH_PATH,
    HOME_ARTICLES_COUNT,
  } from '~articles/model';
  import { HomePanel } from '~home/ui-kit';

  import {
    HOME_ARTICLES_ALL_LABEL,
    HOME_ARTICLES_EMPTY_TEXT,
    HOME_ARTICLES_ICON,
    HOME_ARTICLES_LABEL,
  } from './model';

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
  <HomePanel
    v-if="!isError"
    :label="HOME_ARTICLES_LABEL"
    :icon="HOME_ARTICLES_ICON"
    :to="ARTICLES_ROUTE"
    :link-label="HOME_ARTICLES_ALL_LABEL"
    body-class="p-2"
  >
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-1 sm:grid-cols-2"
    >
      <div
        v-for="index in HOME_ARTICLES_COUNT"
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

    <p
      v-else-if="!hasArticles"
      class="m-1 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_ARTICLES_EMPTY_TEXT }}
    </p>

    <div
      v-else
      class="grid grid-cols-1 gap-1 sm:grid-cols-2"
    >
      <ArticleTile
        v-for="article in data"
        :key="article.id"
        :article
        @open="openArticle(article.url)"
      />
    </div>
  </HomePanel>
</template>
