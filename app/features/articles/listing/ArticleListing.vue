<script setup lang="ts">
  import type {
    ArticleDetailedResponse,
    ArticleShortResponse,
    ArticleType,
  } from '../model';

  import { UiDetailPane } from '~ui/detail-pane';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  import { ArticleBody } from '../body';
  import { ArticleLink } from '../link';
  import {
    ARTICLE_DATE_FORMAT,
    ARTICLES_ADMIN_ROUTE,
    ARTICLES_API_PATH,
    ARTICLES_LIST_COUNT,
    ARTICLES_ROUTE,
    ARTICLES_SEARCH_PATH,
  } from '../model';

  const { type, title } = defineProps<{
    type: ArticleType;
    title: string;
  }>();

  const { isAdmin } = useUserRoles();

  // Поиск — серверный: дебаунсим ввод и уводим в query (пустую строку не шлём;
  // `search` фильтрует по всему набору, `cnt` лишь режет выдачу).
  const search = ref('');
  const debouncedSearch = refDebounced(search, 300);

  // Пагинация «через cnt»: увеличиваем запрашиваемое число и перезапрашиваем.
  const count = ref(ARTICLES_LIST_COUNT);

  // Новый поисковый запрос → сбрасываем пагинацию на первую страницу, иначе
  // раздутый после «Показать ещё» cnt тянулся бы в каждый следующий запрос.
  // Watch объявлен до useAsyncData, чтобы сброс успел примениться к его рефетчу.
  watch(debouncedSearch, () => {
    count.value = ARTICLES_LIST_COUNT;
  });

  const { data, status, error, refresh } = await useAsyncData(
    `articles-list-${type}`,
    () =>
      $fetch<ArticleShortResponse[]>(ARTICLES_SEARCH_PATH, {
        method: 'GET',
        query: {
          cnt: count.value,
          type,
          search: debouncedSearch.value.trim() || undefined,
        },
      }),
    { watch: [count, debouncedSearch] },
  );

  const hasMore = ref(true);

  watch(
    data,
    (value) => {
      hasMore.value = (value?.length ?? 0) >= count.value;
    },
    { immediate: true },
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

  // Правка — в админке (useSectionDetail целится в /workshop, у записей другой путь).
  const detailEditUrl = computed(() =>
    isAdmin.value && detailUrl.value
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
      <UInput
        v-model="search"
        icon="tabler:search"
        placeholder="Поиск по заголовку"
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
          v-else-if="search.trim()"
          class="flex flex-col items-center gap-2 py-12 text-center"
        >
          <UIcon
            name="tabler:search-off"
            class="size-8 text-muted"
          />

          <p class="text-sm text-secondary">
            По запросу «{{ search }}» ничего не найдено
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
