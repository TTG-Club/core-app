<script setup lang="ts">
  import type {
    ArticleDetailedResponse,
    ArticleGrouping,
    ArticleShortResponse,
    ArticleSorting,
    ArticleType,
  } from '../model';

  import { useListPresentationMenus } from '~infrastructure/list-presentation/composable';
  import { UiDetailPane } from '~ui/detail-pane';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  import { ArticleBody } from '../body';
  import { ArticleLink } from '../link';
  import {
    ARTICLE_DATE_FORMAT,
    ARTICLE_LIST_PRESENTATION,
    ARTICLE_SORTING_DEFAULT,
    ARTICLE_TAGS_EMPTY_TEXT,
    ARTICLE_TAGS_FILTER_PLACEHOLDER,
    ARTICLE_TYPE,
    ARTICLES_ADMIN_ROUTE,
    ARTICLES_API_PATH,
    ARTICLES_LIST_COUNT,
    ARTICLES_ROUTE,
    ARTICLES_SEARCH_PATH,
    ARTICLES_TAGS_PATH,
    articleTagsSchema,
    getArticleMarkdown,
    getArticleSearchEmptyText,
  } from '../model';

  const { type, title } = defineProps<{
    type: ArticleType;
    title: string;
  }>();

  const { canEditEntities } = useUserRoles();

  // Поиск — серверный: дебаунсим ввод и уводим в query (пустую строку не шлём;
  // `search` фильтрует по всему набору, `cnt` лишь режет выдачу).
  const search = ref('');
  const debouncedSearch = refDebounced(search, 300);

  // Теги, фильтр по ним, сортировка и рейтинг — только у статей: у новостей
  // лента остаётся хронологической.
  const isArticleListing = computed(() => type === ARTICLE_TYPE.ARTICLE);

  // Фильтр по тегам: запись подходит, если у неё есть хотя бы один выбранный тег.
  const selectedTags = ref<string[]>([]);

  // Сортировка серверная; по умолчанию — по дате выхода. Группировки у записей
  // нет, её ref нужен только общему построителю меню.
  const grouping = ref<ArticleGrouping>(
    ARTICLE_LIST_PRESENTATION.defaultGrouping,
  );

  const sorting = ref<ArticleSorting>(ARTICLE_SORTING_DEFAULT);

  const presentationMenus = useListPresentationMenus(
    ARTICLE_LIST_PRESENTATION,
    grouping,
    sorting,
  );

  const { data: tags } = await useAsyncData(
    `articles-tags-${type}`,
    async () =>
      articleTagsSchema.parse(
        await $fetch<unknown>(ARTICLES_TAGS_PATH, {
          method: 'GET',
          query: { type },
        }),
      ),
    { default: () => [], immediate: isArticleListing.value },
  );

  // Пагинация «через cnt»: увеличиваем запрашиваемое число и перезапрашиваем.
  const count = ref(ARTICLES_LIST_COUNT);

  // Новый поисковый запрос, фильтр или сортировка → сбрасываем пагинацию на
  // первую страницу, иначе раздутый после «Показать ещё» cnt тянулся бы в каждый
  // следующий запрос. Watch объявлен до useAsyncData, чтобы сброс успел
  // примениться к его рефетчу.
  watch([debouncedSearch, selectedTags, sorting], () => {
    count.value = ARTICLES_LIST_COUNT;
  });

  const hasActiveFilter = computed(
    () => !!debouncedSearch.value.trim() || selectedTags.value.length > 0,
  );

  const { data, status, error, refresh } = await useAsyncData(
    `articles-list-${type}`,
    () =>
      $fetch<ArticleShortResponse[]>(ARTICLES_SEARCH_PATH, {
        method: 'GET',
        query: {
          cnt: count.value,
          type,
          search: debouncedSearch.value.trim() || undefined,
          tags: selectedTags.value.length ? selectedTags.value : undefined,
          sorting: isArticleListing.value ? sorting.value : undefined,
        },
      }),
    { watch: [count, debouncedSearch, selectedTags, sorting] },
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
    debouncedSearch.value.trim()
      ? getArticleSearchEmptyText(debouncedSearch.value.trim())
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
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <UInput
            v-model="search"
            icon="tabler:search"
            placeholder="Поиск по заголовку"
            class="min-w-0 grow"
            :ui="{ trailing: 'pe-0.5' }"
          >
            <template
              v-if="search"
              #trailing
            >
              <UButton
                icon="tabler:x"
                variant="link"
                color="neutral"
                size="sm"
                aria-label="Очистить"
                @click.left.exact.prevent="search = ''"
              />
            </template>
          </UInput>

          <template v-if="isArticleListing">
            <UDropdownMenu
              v-for="menu in presentationMenus"
              :key="menu.id"
              :items="menu.items"
              :ui="{ content: 'w-56' }"
            >
              <UButton
                :icon="menu.icon"
                :title="menu.label"
                :aria-label="menu.label"
                square
              />
            </UDropdownMenu>
          </template>
        </div>

        <USelectMenu
          v-if="isArticleListing && tags.length"
          v-model="selectedTags"
          :items="tags"
          multiple
          icon="tabler:tags"
          :placeholder="ARTICLE_TAGS_FILTER_PLACEHOLDER"
          class="w-full"
        />
      </div>
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
