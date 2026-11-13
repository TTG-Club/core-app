<script setup lang="ts">
  import type { ComponentPublicInstance } from 'vue';

  import type { ArticleShortResponse } from '~articles/model';

  import { ArticleHero } from '~articles/card';
  import { ArticleDrawer } from '~articles/drawer';
  import {
    ARTICLE_TYPE,
    ARTICLES_SEARCH_PATH,
    HOME_NEWS_COUNT,
    NEWS_ROUTE,
  } from '~articles/model';
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
    HOME_NEWS_ALL_LABEL,
    HOME_NEWS_EMPTY_TEXT,
    HOME_NEWS_ICON,
    HOME_NEWS_LABEL,
  } from './model';

  /**
   * Новости сайта: на месте всегда одна новость обложкой, свежие сменяют
   * друг друга по таймеру или по переключателю в подвале панели.
   */

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

  // Заглушку ошибки показываем, только если новости ТАК И НЕ загрузились. Если
  // же данные есть, а фоновое обновление упало — оставляем показанное.
  const isError = computed(() => status.value === 'error' && !hasNews.value);

  const { retryNow } = useHomeLoadRetry(status, refresh);

  const newsList = computed(() => data.value ?? []);

  const newsCount = computed(() => newsList.value.length);

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

  /** Новость читают в дровере: пока он открыт, новости не листаются */
  const isReading = ref(false);

  /**
   * Открывает новость в дровере и ждёт, пока его закроют.
   *
   * @param url - адрес новости
   */
  async function openArticle(url: string): Promise<void> {
    isReading.value = true;

    try {
      await articleDrawer.open({ url });
    } finally {
      isReading.value = false;
    }
  }

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

  const activeArticle = computed(() => newsList.value[activeIndex.value]);

  const hasSwitcher = computed(() => newsCount.value > 1);
</script>

<template>
  <HomePanel
    ref="panel"
    :label="HOME_NEWS_LABEL"
    :icon="HOME_NEWS_ICON"
    :to="NEWS_ROUTE"
    :link-label="HOME_NEWS_ALL_LABEL"
    :body-class="HOME_PANEL_COVER_BODY_CLASS"
  >
    <!-- Переключатель стоит в подвале, в одной строке со ссылкой на все
      новости -->
    <template
      v-if="hasSwitcher"
      #aside
    >
      <HomeNewsSwitcher
        :news-list="newsList"
        :active-index="activeIndex"
        :is-stopped="isStopped"
        :is-running="isRunning"
        @select="select"
        @next="showNext"
        @previous="showPrevious"
        @toggle="toggleStopped"
      />
    </template>

    <!-- Скелетон повторяет обложку, чтобы лента не прыгала, когда новости
      приедут -->
    <USkeleton
      v-if="isLoading"
      :class="HOME_NEWS_COVER_SKELETON_CLASS.regular"
    />

    <HomeLoadError
      v-else-if="isError"
      class="m-3"
      :retrying="status === 'pending'"
      @retry="retryNow"
    />

    <p
      v-else-if="!activeArticle"
      class="m-3 flex flex-auto items-center justify-center rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_NEWS_EMPTY_TEXT }}
    </p>

    <!-- Новая обложка проявляется на месте прежней: обложки одного размера,
      вёрстка под ними не двигается. Проявление — CSS-анимация самой обложки,
      а не Transition: ей не нужно ждать ухода прежней -->
    <ArticleHero
      v-else
      :key="activeArticle.id"
      :article="activeArticle"
      class="animate-appear motion-reduce:animate-none"
      @open="openArticle(activeArticle.url)"
      @video="setVideoOpen"
    />
  </HomePanel>
</template>
