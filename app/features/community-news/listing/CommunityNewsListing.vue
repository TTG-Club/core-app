<script setup lang="ts">
  import type { CommunityNewsDetailedResponse } from '../model';

  import { FilterControls } from '~infrastructure/filter';
  import { UiDetailPane, UiDetailPaneEmpty } from '~ui/detail-pane';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  import { CommunityNewsBody } from '../body';
  import { CommunityNewsLink } from '../link';
  import {
    COMMUNITY_NEWS_API_PATH,
    COMMUNITY_NEWS_DATE_FORMAT,
    COMMUNITY_NEWS_LIST_COUNT,
    COMMUNITY_NEWS_LISTING_TEXT,
    COMMUNITY_NEWS_ROUTE,
    COMMUNITY_NEWS_SEARCH_DEBOUNCE,
    COMMUNITY_NEWS_SEARCH_PATH,
    COMMUNITY_NEWS_SKELETON_COUNT,
    COMMUNITY_NEWS_TITLE,
    getCommunityNewsEditRoute,
    getCommunityNewsMarkdown,
    getCommunityNewsSearchEmptyText,
    parseCommunityNewsList,
  } from '../model';

  const { canPublishCommunityNews } = useUserRoles();

  // Фильтров у новостей сообщества нет — в общем тулбаре раздела остаётся
  // только серверный поиск по заголовку.
  const search = ref<string>('');
  const debouncedSearch = refDebounced(search, COMMUNITY_NEWS_SEARCH_DEBOUNCE);

  // Пагинация «через cnt», как у новостей сайта: растим число и перезапрашиваем.
  const count = ref(COMMUNITY_NEWS_LIST_COUNT);

  // Новый запрос → снова первая страница, иначе раздутый «Показать ещё» cnt
  // тянулся бы дальше. Объявлен до useAsyncData, чтобы сброс успел к рефетчу.
  watch(debouncedSearch, () => {
    count.value = COMMUNITY_NEWS_LIST_COUNT;
  });

  const {
    data: newsList,
    status,
    error,
    refresh,
  } = await useAsyncData(
    'community-news-list',
    async () =>
      parseCommunityNewsList(
        await $fetch(COMMUNITY_NEWS_SEARCH_PATH, {
          method: 'GET',
          query: {
            cnt: count.value,
            search: debouncedSearch.value.trim() || undefined,
          },
        }),
      ),
    { watch: [count, debouncedSearch] },
  );

  const hasMore = computed(() => (newsList.value?.length ?? 0) >= count.value);

  const isInitialLoading = computed(
    () => status.value === 'pending' && !newsList.value?.length,
  );

  const isLoadingMore = computed(
    () => status.value === 'pending' && !!newsList.value?.length,
  );

  /** Догружает следующую порцию новостей. */
  function loadMore(): void {
    count.value += COMMUNITY_NEWS_LIST_COUNT;
  }

  const {
    detailUrl,
    detailData,
    isDetailLoading,
    isDetailError,
    detailUrlForCopy,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  } = useSectionDetail<CommunityNewsDetailedResponse>({
    sectionPath: COMMUNITY_NEWS_ROUTE,
    apiBasePath: COMMUNITY_NEWS_API_PATH,
    items: newsList,
  });

  useSectionNeighbours(COMMUNITY_NEWS_ROUTE, () =>
    newsList.value?.map((news) => news.url),
  );

  const markdown = useEntityMarkdown(detailData, getCommunityNewsMarkdown);

  // Правка — в инструменте публикации (useSectionDetail целится в /workshop).
  const detailEditUrl = computed(() =>
    canPublishCommunityNews.value && detailUrl.value
      ? getCommunityNewsEditRoute(detailUrl.value)
      : undefined,
  );

  const emptySearchText = computed(() =>
    getCommunityNewsSearchEmptyText(debouncedSearch.value),
  );
</script>

<template>
  <NuxtLayout
    name="section"
    collapsible-controls
    :title="COMMUNITY_NEWS_TITLE"
  >
    <template #controls>
      <FilterControls v-model:search="search" />
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid v-if="isInitialLoading">
          <SkeletonLinkBig
            v-for="index in COMMUNITY_NEWS_SKELETON_COUNT"
            :key="index"
          />
        </PageGrid>

        <div
          v-else-if="newsList?.length"
          class="flex flex-col gap-4"
        >
          <PageGrid>
            <CommunityNewsLink
              v-for="news in newsList"
              :key="news.id"
              :news
            />
          </PageGrid>

          <div
            v-if="hasMore"
            class="flex justify-center"
          >
            <UButton
              variant="soft"
              color="neutral"
              :loading="isLoadingMore"
              @click.left.exact.prevent="loadMore"
            >
              {{ COMMUNITY_NEWS_LISTING_TEXT.loadMore }}
            </UButton>
          </div>
        </div>

        <div
          v-else-if="debouncedSearch"
          class="flex flex-col items-center gap-2 py-12 text-center"
        >
          <UIcon
            name="tabler:search-off"
            class="size-8 text-muted"
          />

          <p class="text-sm text-secondary">
            {{ emptySearchText }}
          </p>
        </div>

        <PageResult
          v-else
          :items="newsList"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailData?.title ?? ''"
        :date-time="detailData?.publishDateTime"
        :date-time-format="COMMUNITY_NEWS_DATE_FORMAT"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :markdown
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        :neighbours="detailNeighbours"
        @close="handleCloseDetail"
        @navigate="openDetail"
      >
        <CommunityNewsBody
          v-if="detailData"
          :news="detailData"
        />
      </UiDetailPane>

      <UiDetailPaneEmpty
        v-else
        :title="COMMUNITY_NEWS_LISTING_TEXT.emptyDetailTitle"
        :description="COMMUNITY_NEWS_LISTING_TEXT.emptyDetailDescription"
      />
    </template>
  </NuxtLayout>
</template>
