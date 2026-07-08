<script setup lang="ts">
  import type {
    ArticleAdminTab,
    ArticleShortResponse,
    ArticleTypeFilter,
  } from '~articles/model';

  import { ArticleAdminRow, useArticleAdmin } from '~articles/admin';
  import {
    ARTICLE_ADMIN_TABS,
    ARTICLE_TYPE_FILTER_OPTIONS,
    ARTICLES_ADMIN_CREATE_ROUTE,
    ARTICLES_ADMIN_LIST_COUNT,
    ARTICLES_SEARCH_PATH,
    ARTICLES_UNPUBLISHED_SEARCH_PATH,
  } from '~articles/model';

  useSeoMeta({
    title: 'Статьи и новости',
  });

  const requestFetch = useRequestFetch();

  const activeTab = ref<ArticleAdminTab>('published');
  const typeFilter = ref<ArticleTypeFilter>('all');

  // Поиск (серверный, дебаунс) — параметр `search` есть и у /search/unpublished.
  const search = ref('');
  const debouncedSearch = refDebounced(search, 300);

  // Опубликованные грузим из /search, черновики и отложенные — из /search/unpublished.
  const searchPath = computed(() =>
    activeTab.value === 'published'
      ? ARTICLES_SEARCH_PATH
      : ARTICLES_UNPUBLISHED_SEARCH_PATH,
  );

  // server: false — приватные данные админки грузим на клиенте, где авторизация
  // (cookie → Bearer) гарантированно работает (та же стратегия, что в подписках).
  const {
    data: articles,
    status,
    error,
    refresh,
  } = await useAsyncData<ArticleShortResponse[]>(
    'admin-articles',
    () =>
      requestFetch(searchPath.value, {
        query: {
          cnt: ARTICLES_ADMIN_LIST_COUNT,
          type: typeFilter.value === 'all' ? undefined : typeFilter.value,
          search: debouncedSearch.value.trim() || undefined,
        },
      }),
    {
      default: () => [],
      server: false,
      // lazy: клиент не блокирует первый рендер ожиданием запроса — иначе SSR
      // отдаёт пустое состояние, а клиент после await сразу список → hydration mismatch.
      lazy: true,
      watch: [activeTab, typeFilter, debouncedSearch],
    },
  );

  // idle учитываем наравне с pending: при server:false на SSR статус 'idle',
  // и обе стороны должны отрендерить скелетон (одинаковый DOM), а не пусто↔список.
  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const hasError = computed(() => !!error.value);

  const { deletingUrl, togglingUrl, deleteArticle, setActive } =
    useArticleAdmin();

  // Активность меняется через PUT всей записи → после успеха обновляем список:
  // запись переезжает между вкладками «Опубликованные»/«Черновики».
  async function handleToggleActive(
    url: string,
    active: boolean,
  ): Promise<void> {
    const isDone = await setActive(url, active);

    if (isDone) {
      await refresh();
    }
  }

  // Подтверждение удаления: url в очереди на удаление открывает модалку.
  const pendingDeleteUrl = ref<string | null>(null);

  const isConfirmOpen = computed({
    get: () => pendingDeleteUrl.value !== null,
    set: (open: boolean) => {
      if (!open) {
        pendingDeleteUrl.value = null;
      }
    },
  });

  function requestDelete(url: string): void {
    pendingDeleteUrl.value = url;
  }

  async function confirmDelete(): Promise<void> {
    const url = pendingDeleteUrl.value;

    if (!url) {
      return;
    }

    const isDeleted = await deleteArticle(url);

    if (isDeleted && articles.value) {
      articles.value = articles.value.filter((article) => article.url !== url);
    }

    pendingDeleteUrl.value = null;
  }
</script>

<template>
  <div>
    <NuxtLayout
      name="detail"
      title="Статьи и новости"
    >
      <div class="flex flex-col gap-6">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <UTabs
            v-model="activeTab"
            :items="ARTICLE_ADMIN_TABS"
            :content="false"
            class="w-full sm:w-auto"
          />

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UInput
              v-model="search"
              icon="tabler:search"
              placeholder="Поиск по заголовку"
              class="w-full sm:w-56"
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

            <USelectMenu
              v-model="typeFilter"
              :items="ARTICLE_TYPE_FILTER_OPTIONS"
              value-key="value"
              label-key="label"
              class="min-w-40"
            />

            <UButton
              :to="ARTICLES_ADMIN_CREATE_ROUTE"
              icon="tabler:plus"
            >
              Создать
            </UButton>
          </div>
        </div>

        <div
          v-if="isLoading"
          class="flex flex-col gap-2"
        >
          <USkeleton
            v-for="index in 6"
            :key="index"
            class="h-16 w-full rounded-xl"
          />
        </div>

        <div
          v-else-if="hasError"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <p class="text-sm text-error">Не удалось загрузить записи</p>

          <UButton
            icon="tabler:refresh"
            color="neutral"
            variant="soft"
            size="sm"
            @click.left.exact.prevent="() => refresh()"
          >
            Повторить
          </UButton>
        </div>

        <div
          v-else-if="articles?.length"
          class="flex flex-col gap-2"
        >
          <ArticleAdminRow
            v-for="article in articles"
            :key="article.id"
            :article
            :deleting="deletingUrl === article.url"
            :toggling="togglingUrl === article.url"
            @delete="requestDelete"
            @toggle-active="handleToggleActive"
          />
        </div>

        <div
          v-else
          class="py-12 text-center text-secondary"
        >
          {{
            search.trim()
              ? `По запросу «${search}» ничего не найдено`
              : 'Записей пока нет — создайте первую'
          }}
        </div>
      </div>
    </NuxtLayout>

    <UModal
      v-model:open="isConfirmOpen"
      title="Скрыть запись?"
      description="Запись будет скрыта (мягкое удаление): она пропадёт из публичных списков и со страницы чтения, но не удалится физически."
    >
      <template #body>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click.left.exact.prevent="isConfirmOpen = false"
          >
            Отмена
          </UButton>

          <UButton
            color="error"
            :loading="deletingUrl !== null"
            @click.left.exact.prevent="confirmDelete"
          >
            Скрыть
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
