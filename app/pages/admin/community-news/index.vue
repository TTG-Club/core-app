<script setup lang="ts">
  import type {
    CommunityNewsAdminTab,
    CommunityNewsShortResponse,
  } from '~community-news/model';

  import {
    CommunityNewsAdminRow,
    useCommunityNewsAdmin,
  } from '~community-news/admin';
  import {
    COMMUNITY_NEWS_ADMIN_CREATE_ROUTE,
    COMMUNITY_NEWS_ADMIN_EMPTY_TEXTS,
    COMMUNITY_NEWS_ADMIN_LIST_COUNT,
    COMMUNITY_NEWS_ADMIN_TAB_STATUSES,
    COMMUNITY_NEWS_ADMIN_TABS,
    COMMUNITY_NEWS_ADMIN_TEXT,
    COMMUNITY_NEWS_ADMIN_TITLE,
    COMMUNITY_NEWS_EDITOR_ROLES,
    COMMUNITY_NEWS_ROUTE,
    COMMUNITY_NEWS_SEARCH_DEBOUNCE,
    COMMUNITY_NEWS_SEARCH_PATH,
    COMMUNITY_NEWS_SKELETON_COUNT,
    COMMUNITY_NEWS_UNPUBLISHED_SEARCH_PATH,
    getCommunityNewsSearchEmptyText,
    parseCommunityNewsList,
  } from '~community-news/model';

  // Инструмент открыт не только админу: мета дочерней страницы перекрывает
  // роли родителя (admin.vue).
  definePageMeta({
    auth: { roles: [...COMMUNITY_NEWS_EDITOR_ROLES] },
  });

  useSeoMeta({
    title: COMMUNITY_NEWS_ADMIN_TITLE,
  });

  const requestFetch = useRequestFetch();

  const activeTab = ref<CommunityNewsAdminTab>('published');

  const search = ref('');
  const debouncedSearch = refDebounced(search, COMMUNITY_NEWS_SEARCH_DEBOUNCE);

  // Опубликованные — из /search; неопубликованные и черновики — из общего
  // /search/unpublished (дальше делим по `status`).
  const searchPath = computed(() =>
    activeTab.value === 'published'
      ? COMMUNITY_NEWS_SEARCH_PATH
      : COMMUNITY_NEWS_UNPUBLISHED_SEARCH_PATH,
  );

  // Приватные данные грузим на клиенте (как список новостей сайта): там
  // авторизация cookie → Bearer гарантированно работает.
  const {
    data: newsList,
    status,
    error,
    refresh,
  } = await useAsyncData<CommunityNewsShortResponse[]>(
    'admin-community-news',
    async () =>
      parseCommunityNewsList(
        await requestFetch(searchPath.value, {
          query: {
            cnt: COMMUNITY_NEWS_ADMIN_LIST_COUNT,
            search: debouncedSearch.value.trim() || undefined,
          },
        }),
      ),
    {
      default: () => [],
      server: false,
      lazy: true,
      // searchPath, а не activeTab: «Неопубликованные» и «Черновики» — один
      // эндпоинт, переключение между ними не перезапрашивает список.
      watch: [searchPath, debouncedSearch],
    },
  );

  const visibleNews = computed<CommunityNewsShortResponse[]>(() => {
    const list = newsList.value ?? [];
    const statuses = COMMUNITY_NEWS_ADMIN_TAB_STATUSES[activeTab.value];

    return statuses
      ? list.filter((news) => statuses.includes(news.status))
      : list;
  });

  const emptyLabel = computed(() =>
    search.value.trim()
      ? getCommunityNewsSearchEmptyText(search.value)
      : COMMUNITY_NEWS_ADMIN_EMPTY_TEXTS[activeTab.value],
  );

  // idle наравне с pending: список в ClientOnly, на первом клиентском рендере
  // статус ещё 'idle' — показываем скелетон, а не «пусто».
  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const hasError = computed(() => !!error.value);

  const [DefineSkeleton, ReuseSkeleton] = createReusableTemplate();

  const { deletingUrl, togglingUrl, deleteNews, setActive } =
    useCommunityNewsAdmin();

  /** Включает/снимает новость и перечитывает список: она переезжает между вкладками. */
  async function handleToggleActive(
    url: string,
    active: boolean,
  ): Promise<void> {
    const isDone = await setActive(url, active);

    if (isDone) {
      await refresh();
    }
  }

  const pendingDeleteUrl = ref<string | null>(null);

  const isConfirmOpen = computed({
    get: () => pendingDeleteUrl.value !== null,
    set: (open: boolean) => {
      if (!open) {
        pendingDeleteUrl.value = null;
      }
    },
  });

  /** Открывает подтверждение скрытия новости. */
  function requestDelete(url: string): void {
    pendingDeleteUrl.value = url;
  }

  /** Скрывает новость после подтверждения и убирает её из списка. */
  async function confirmDelete(): Promise<void> {
    const url = pendingDeleteUrl.value;

    if (!url) {
      return;
    }

    const isDeleted = await deleteNews(url);

    if (isDeleted && newsList.value) {
      newsList.value = newsList.value.filter((news) => news.url !== url);
    }

    pendingDeleteUrl.value = null;
  }
</script>

<template>
  <div>
    <NuxtLayout
      name="detail"
      :title="COMMUNITY_NEWS_ADMIN_TITLE"
    >
      <div class="flex flex-col gap-6">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <UTabs
            v-model="activeTab"
            :items="COMMUNITY_NEWS_ADMIN_TABS"
            :content="false"
            class="w-full sm:w-auto"
          />

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UInput
              v-model="search"
              icon="tabler:search"
              :placeholder="COMMUNITY_NEWS_ADMIN_TEXT.searchPlaceholder"
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
                  :aria-label="COMMUNITY_NEWS_ADMIN_TEXT.clearSearch"
                  @click.left.exact.prevent="search = ''"
                />
              </template>
            </UInput>

            <UButton
              :to="COMMUNITY_NEWS_ROUTE"
              icon="tabler:eye"
              color="neutral"
              variant="soft"
            >
              {{ COMMUNITY_NEWS_ADMIN_TEXT.openSite }}
            </UButton>

            <UButton
              :to="COMMUNITY_NEWS_ADMIN_CREATE_ROUTE"
              icon="tabler:plus"
            >
              {{ COMMUNITY_NEWS_ADMIN_TEXT.create }}
            </UButton>
          </div>
        </div>

        <DefineSkeleton>
          <div class="flex flex-col gap-2">
            <USkeleton
              v-for="index in COMMUNITY_NEWS_SKELETON_COUNT"
              :key="index"
              class="h-16 w-full rounded-xl"
            />
          </div>
        </DefineSkeleton>

        <ClientOnly>
          <ReuseSkeleton v-if="isLoading" />

          <div
            v-else-if="hasError"
            class="flex flex-col items-center gap-3 py-12 text-center"
          >
            <p class="text-sm text-error">
              {{ COMMUNITY_NEWS_ADMIN_TEXT.loadError }}
            </p>

            <UButton
              icon="tabler:refresh"
              color="neutral"
              variant="soft"
              size="sm"
              @click.left.exact.prevent="() => refresh()"
            >
              {{ COMMUNITY_NEWS_ADMIN_TEXT.retry }}
            </UButton>
          </div>

          <div
            v-else-if="visibleNews.length"
            class="flex flex-col gap-2"
          >
            <CommunityNewsAdminRow
              v-for="news in visibleNews"
              :key="news.id"
              :news
              :deleting="deletingUrl === news.url"
              :toggling="togglingUrl === news.url"
              @delete="requestDelete"
              @toggle-active="handleToggleActive"
            />
          </div>

          <div
            v-else
            class="py-12 text-center text-secondary"
          >
            {{ emptyLabel }}
          </div>

          <template #fallback>
            <ReuseSkeleton />
          </template>
        </ClientOnly>
      </div>
    </NuxtLayout>

    <UModal
      v-model:open="isConfirmOpen"
      :title="COMMUNITY_NEWS_ADMIN_TEXT.deleteTitle"
      :description="COMMUNITY_NEWS_ADMIN_TEXT.deleteDescription"
    >
      <template #body>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click.left.exact.prevent="isConfirmOpen = false"
          >
            {{ COMMUNITY_NEWS_ADMIN_TEXT.cancel }}
          </UButton>

          <UButton
            color="error"
            :loading="deletingUrl !== null"
            @click.left.exact.prevent="confirmDelete"
          >
            {{ COMMUNITY_NEWS_ADMIN_TEXT.hide }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
