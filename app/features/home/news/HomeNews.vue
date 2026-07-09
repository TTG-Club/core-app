<script setup lang="ts">
  import type { TimelineItem } from '@nuxt/ui';

  import type { ArticleShortResponse } from '~articles/model';

  import { ArticleHero } from '~articles/card';
  import { ArticleDrawer } from '~articles/drawer';
  import {
    ARTICLE_DATE_FORMAT,
    ARTICLE_TYPE,
    ARTICLES_SEARCH_PATH,
    getArticleRoute,
    HOME_NEWS_COUNT,
    NEWS_ROUTE,
  } from '~articles/model';

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

  const { format } = useDayjs();

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

  // Остальные новости (после «геройской») — компактной лентой-таймлайном.
  // url — маршрут страницы (для ссылки/ctrl+click), slug — для открытия в дровере.
  const timelineItems = computed<
    Array<TimelineItem & { url: string; slug: string }>
  >(() =>
    (data.value ?? []).slice(1).map((article) => ({
      value: article.id,
      title: article.title,
      date: article.publishDateTime
        ? format(article.publishDateTime, ARTICLE_DATE_FORMAT)
        : '',
      icon: 'tabler:news',
      url: getArticleRoute(article.url),
      slug: article.url,
    })),
  );

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
  <UCard
    v-if="!isError"
    :ui="{ root: 'bg-muted overflow-hidden', body: 'p-0 sm:p-0' }"
  >
    <div
      v-if="isLoading"
      class="flex flex-col"
    >
      <USkeleton class="h-44 w-full rounded-none sm:h-52" />

      <div class="flex flex-col gap-3 p-3">
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-5 w-3/4 rounded-md"
        />
      </div>
    </div>

    <p
      v-else-if="!hasNews"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      Новостей пока нет
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
        v-if="timelineItems.length"
        class="p-3"
      >
        <UTimeline
          :items="timelineItems"
          color="primary"
          :ui="{
            indicator: 'bg-border',
            separator: 'border-l-2 border-default',
          }"
        >
          <template #date="{ item }">
            <div class="flex items-center gap-2">
              <span>{{ item.date }}</span>

              <UButton
                :to="item.url"
                icon="tabler:external-link"
                color="neutral"
                variant="ghost"
                size="xs"
                class="shrink-0"
                :aria-label="`Открыть «${item.title}» на отдельной странице`"
              />
            </div>
          </template>

          <template #title="{ item }">
            <button
              type="button"
              class="cursor-pointer text-left font-medium text-highlighted hover:underline"
              @click="openArticle(item.slug)"
            >
              {{ item.title }}
            </button>
          </template>
        </UTimeline>
      </div>

      <UButton
        :to="NEWS_ROUTE"
        block
        size="lg"
        color="neutral"
        variant="soft"
        trailing-icon="tabler:arrow-right"
        class="justify-center rounded-none border-t border-default"
      >
        Все новости
      </UButton>
    </div>
  </UCard>
</template>
