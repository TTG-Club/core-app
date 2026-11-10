<script setup lang="ts">
  import { CommunityNewsTile } from '~community-news/card';
  import { CommunityNewsDrawer } from '~community-news/drawer';
  import {
    COMMUNITY_NEWS_ICON,
    COMMUNITY_NEWS_ROUTE,
    COMMUNITY_NEWS_SEARCH_PATH,
    COMMUNITY_NEWS_TITLE,
    parseCommunityNewsList,
  } from '~community-news/model';
  import { HomePanel } from '~home/ui-kit';

  import {
    HOME_COMMUNITY_NEWS_ALL_LABEL,
    HOME_COMMUNITY_NEWS_COUNT,
    HOME_COMMUNITY_NEWS_EMPTY_TEXT,
  } from './model';

  // Клиентская загрузка, как у новостей и статей: блок ниже сгиба и не должен
  // держать первый ответ главной в ожидании бэкенда.
  const {
    data: newsList,
    status,
    refresh,
  } = await useAsyncData(
    'home-community-news',
    async () =>
      parseCommunityNewsList(
        await $fetch(COMMUNITY_NEWS_SEARCH_PATH, {
          method: 'GET',
          query: { cnt: HOME_COMMUNITY_NEWS_COUNT },
        }),
      ),
    { default: () => [], lazy: true, server: false },
  );

  const hasNews = computed(() => (newsList.value?.length ?? 0) > 0);

  // Вернулись на вкладку — подтягиваем свежее (новость могли опубликовать в
  // соседней вкладке).
  const visibility = useDocumentVisibility();

  watch(visibility, (state, previous) => {
    if (state === 'visible' && previous === 'hidden') {
      refresh();
    }
  });

  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle') && !hasNews.value,
  );

  const overlay = useOverlay();

  const newsDrawer = overlay.create(CommunityNewsDrawer, {
    destroyOnClose: true,
    props: {
      url: '',
      onClose: () => newsDrawer.close(),
    },
  });

  /** Открывает новость в дровере. */
  function openNews(url: string): void {
    newsDrawer.open({ url });
  }
</script>

<template>
  <!-- Блок виден всегда: если новостей нет или бэкенд их ещё не отдаёт,
    стоит та же заглушка «пока нет», что у новостей и статей — раскладка ленты
    не прыгает -->
  <HomePanel
    :label="COMMUNITY_NEWS_TITLE"
    :icon="COMMUNITY_NEWS_ICON"
    :to="COMMUNITY_NEWS_ROUTE"
    :link-label="HOME_COMMUNITY_NEWS_ALL_LABEL"
    body-class="@container p-2"
  >
    <!-- Столбец или две колонки — по ширине самой панели, а не экрана: на
      xl блок стоит в четверти ленты, но если соседа нет, растягивается на
      половину -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-1 @lg:grid-cols-2"
    >
      <div
        v-for="index in HOME_COMMUNITY_NEWS_COUNT"
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
      v-else-if="!hasNews"
      class="m-1 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_COMMUNITY_NEWS_EMPTY_TEXT }}
    </p>

    <div
      v-else
      class="grid grid-cols-1 gap-1 @lg:grid-cols-2"
    >
      <CommunityNewsTile
        v-for="news in newsList"
        :key="news.id"
        :news
        @open="openNews(news.url)"
      />
    </div>
  </HomePanel>
</template>
