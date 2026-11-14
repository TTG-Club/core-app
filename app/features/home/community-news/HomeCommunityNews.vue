<script setup lang="ts">
  import type { ComponentPublicInstance } from 'vue';

  import { CommunityNewsHero } from '~community-news/card';
  import { CommunityNewsDrawer } from '~community-news/drawer';
  import {
    COMMUNITY_NEWS_ICON,
    COMMUNITY_NEWS_ROUTE,
    COMMUNITY_NEWS_SEARCH_PATH,
    COMMUNITY_NEWS_TITLE,
    parseCommunityNewsList,
  } from '~community-news/model';
  import {
    HOME_NEWS_COVER_SKELETON_CLASS,
    HOME_PANEL_COVER_BODY_CLASS,
    HomeLoadError,
    HomeNewsSwitcher,
    HomePanel,
    useHomeLoadRetry,
    useHomeNewsRotation,
  } from '~home/ui-kit';

  import {
    HOME_COMMUNITY_NEWS_ALL_LABEL,
    HOME_COMMUNITY_NEWS_COUNT,
    HOME_COMMUNITY_NEWS_EMPTY_TEXT,
  } from './model';

  /**
   * Новости сообщества — как новости сайта, только в узкой панели: одна
   * новость обложкой, свежие сменяют друг друга по таймеру или по
   * переключателю в подвале.
   */

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

  // Ошибка — только если новости так и не загрузились: упавшее фоновое
  // обновление оставляет показанное.
  const isError = computed(() => status.value === 'error' && !hasNews.value);

  const { retryNow } = useHomeLoadRetry(status, refresh);

  const overlay = useOverlay();

  const newsDrawer = overlay.create(CommunityNewsDrawer, {
    destroyOnClose: true,
    props: {
      url: '',
      onClose: () => newsDrawer.close(),
    },
  });

  /** Новость читают в дровере: пока он открыт, новости не листаются */
  const isReading = ref(false);

  /**
   * Открывает новость в дровере и ждёт, пока его закроют.
   *
   * @param url - адрес новости
   */
  async function openNews(url: string): Promise<void> {
    isReading.value = true;

    try {
      await newsDrawer.open({ url });
    } finally {
      isReading.value = false;
    }
  }

  const newsCount = computed(() => newsList.value.length);

  const panel = useTemplateRef<ComponentPublicInstance>('panel');

  const {
    activeIndex,
    isStopped,
    isRunning,
    select,
    showNext,
    showPrevious,
    toggleStopped,
    setVideoOpen,
  } = useHomeNewsRotation(newsCount, panel, isReading);

  const activeNews = computed(() => newsList.value[activeIndex.value]);

  const hasSwitcher = computed(() => newsCount.value > 1);
</script>

<template>
  <!-- Блок виден всегда: если новостей нет, стоит заглушка «пока нет», если
    запрос упал — «не удалось загрузить» с повтором; раскладка ленты не
    прыгает -->
  <HomePanel
    ref="panel"
    :label="COMMUNITY_NEWS_TITLE"
    :icon="COMMUNITY_NEWS_ICON"
    :to="COMMUNITY_NEWS_ROUTE"
    :link-label="HOME_COMMUNITY_NEWS_ALL_LABEL"
    :body-class="HOME_PANEL_COVER_BODY_CLASS"
  >
    <!-- В узкой панели от переключателя остаются только точки -->
    <template
      v-if="hasSwitcher"
      #aside
    >
      <HomeNewsSwitcher
        :news-list="newsList"
        :active-index="activeIndex"
        :is-stopped="isStopped"
        :is-running="isRunning"
        compact
        @select="select"
        @next="showNext"
        @previous="showPrevious"
        @toggle="toggleStopped"
      />
    </template>

    <USkeleton
      v-if="isLoading"
      :class="HOME_NEWS_COVER_SKELETON_CLASS.compact"
    />

    <HomeLoadError
      v-else-if="isError"
      class="m-3"
      :retrying="status === 'pending'"
      @retry="retryNow"
    />

    <p
      v-else-if="!activeNews"
      class="m-3 flex flex-auto items-center justify-center rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_COMMUNITY_NEWS_EMPTY_TEXT }}
    </p>

    <CommunityNewsHero
      v-else
      :key="activeNews.id"
      :news="activeNews"
      class="animate-appear motion-reduce:animate-none"
      @open="openNews(activeNews.url)"
      @video="setVideoOpen"
    />
  </HomePanel>
</template>
