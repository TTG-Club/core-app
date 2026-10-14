<script setup lang="ts">
  import type {
    ArticleDetailedResponse,
    ArticleShortResponse,
    ArticleType,
  } from '../model';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import {
    useListPresentation,
    useListPresentationMenus,
  } from '~infrastructure/list-presentation/composable';
  import { UiDetailPane } from '~ui/detail-pane';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  import { ArticleBody } from '../body';
  import { ArticleLink } from '../link';
  import {
    ARTICLE_DATE_FORMAT,
    ARTICLE_LIST_PRESENTATION,
    ARTICLE_TAGS_EMPTY_TEXT,
    ARTICLE_TYPE,
    ARTICLES_ADMIN_ROUTE,
    ARTICLES_API_PATH,
    ARTICLES_FILTERS_PATH,
    ARTICLES_LIST_COUNT,
    ARTICLES_ROUTE,
    ARTICLES_SEARCH_PATH,
    getArticleMarkdown,
    getArticleSearchEmptyText,
  } from '../model';

  const { type, title } = defineProps<{
    type: ArticleType;
    title: string;
  }>();

  const { canEditEntities } = useUserRoles();

  // Тулбар — общий для разделов: поиск, отбор по тегам и сортировка в одном
  // `FilterControls`. Поиск серверный и вместе с выбранными тегами живёт в
  // адресе страницы. Новостям бэкенд отдаёт фильтр без групп — у них остаётся
  // только поиск.
  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    defaults: filterDefaults,
  } = await useFilter(
    `articles-${type}`,
    `${ARTICLES_FILTERS_PATH}?type=${type}`,
  );

  // Сортировка и рейтинг — только у статей: у новостей лента остаётся
  // хронологической. Сортировка серверная и запоминается, как в других разделах.
  const isArticleListing = computed(() => type === ARTICLE_TYPE.ARTICLE);

  const presentation = useListPresentation(ARTICLE_LIST_PRESENTATION);

  const articlePresentationMenus = useListPresentationMenus(
    ARTICLE_LIST_PRESENTATION,
    presentation.grouping,
    presentation.sorting,
  );

  const presentationMenus = computed(() =>
    isArticleListing.value ? articlePresentationMenus.value : [],
  );

  const sorting = computed(() =>
    isArticleListing.value ? presentation.query.value.sorting : undefined,
  );

  // Пагинация «через cnt»: увеличиваем запрашиваемое число и перезапрашиваем.
  const count = ref(ARTICLES_LIST_COUNT);

  // Новый поисковый запрос, фильтр или сортировка → сбрасываем пагинацию на
  // первую страницу, иначе раздутый после «Показать ещё» cnt тянулся бы в каждый
  // следующий запрос. Watch объявлен до useAsyncData, чтобы сброс успел
  // примениться к его рефетчу.
  watch([search, filterQuery, sorting], () => {
    count.value = ARTICLES_LIST_COUNT;
  });

  const hasActiveFilter = computed(
    () => !!search.value || Object.keys(filterQuery.value).length > 0,
  );

  const { data, status, error, refresh } = await useAsyncData(
    `articles-list-${type}`,
    () =>
      $fetch<ArticleShortResponse[]>(ARTICLES_SEARCH_PATH, {
        method: 'GET',
        query: {
          cnt: count.value,
          type,
          search: search.value,
          sorting: sorting.value,
          ...filterQuery.value,
        },
      }),
    { watch: [count, search, filterQuery, sorting] },
  );

  const hasMore = ref(true);

  watch(
    data,
    (value) => {
      hasMore.value = (value?.length ?? 0) >= count.value;
    },
    { immediate: true },
  );

  const emptyFilterText = computed(() =>
    search.value
      ? getArticleSearchEmptyText(search.value)
      : ARTICLE_TAGS_EMPTY_TEXT,
  );

  const isInitialLoading = computed(
    () => status.value === 'pending' && !data.value?.length,
  );

  const isLoadingMore = computed(
    () => status.value === 'pending' && !!data.value?.length,
  );

  function loadMore(): void {
    count.value += ARTICLES_LIST_COUNT;
  }

  // Детальная панель (Wide Mode) — общий composable раздела. Читаем по общему
  // маршруту `/articles/{url}` (одна ручка для новостей и статей).
  const {
    detailUrl,
    detailData,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    handleCloseDetail,
  } = useSectionDetail<ArticleDetailedResponse>({
    sectionPath: ARTICLES_ROUTE,
    apiBasePath: ARTICLES_API_PATH,
    items: data,
  });

  const markdown = useEntityMarkdown(detailData, getArticleMarkdown);

  // Правка — в админке (useSectionDetail целится в /workshop, у записей другой путь).
  const detailEditUrl = computed(() =>
    canEditEntities.value && detailUrl.value
      ? `${ARTICLES_ADMIN_ROUTE}/${detailUrl.value}`
      : undefined,
  );
</script>

<template>
  <NuxtLayout
    name="section"
    :title="title"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :presentation-menus="presentationMenus"
      />
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid v-if="isInitialLoading">
          <SkeletonLinkBig
            v-for="index in 6"
            :key="index"
          />
        </PageGrid>

        <div
          v-else-if="data?.length"
          class="flex flex-col gap-4"
        >
          <PageGrid>
            <ArticleLink
              v-for="article in data"
              :key="article.id"
              :article
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
              Показать ещё
            </UButton>
          </div>
        </div>

        <div
          v-else-if="hasActiveFilter"
          class="flex flex-col items-center gap-2 py-12 text-center"
        >
          <UIcon
            name="tabler:search-off"
            class="size-8 text-muted"
          />

          <p class="text-sm text-secondary">
            {{ emptyFilterText }}
          </p>
        </div>

        <PageResult
          v-else
          :items="data"
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
        :date-time-format="ARTICLE_DATE_FORMAT"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :markdown
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <ArticleBody
          v-if="detailData"
          :article="detailData"
        />
      </UiDetailPane>

      <div
        v-else-if="isDetailDismissed"
        class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
      >
        <div class="flex max-w-xs flex-col items-center gap-3">
          <UIcon
            name="tabler:click"
            class="size-10 text-muted"
          />

          <h3 class="text-lg font-semibold text-highlighted">
            Запись не выбрана
          </h3>

          <p class="text-sm text-secondary">
            Выберите запись из списка слева, чтобы прочитать её здесь.
          </p>
        </div>
      </div>

      <UiDetailPane
        v-else
        title=""
        :is-loading="true"
      />
    </template>
  </NuxtLayout>
</template>
