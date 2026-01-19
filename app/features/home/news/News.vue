<script setup lang="ts">
  const NEWS_LIMIT = 10;

  interface ArticleDetailedResponse {
    id: string;
    url: string;
    publishDateTime?: string;
    title: string;
    previewImageUrl?: string;
    preview?: string;
    content?: string;
    updatedAt: string;
    createdAt: string;
  }

  const dayjs = useDayjs();

  function formatDateTime(iso: string | undefined) {
    if (!iso) {
      return undefined;
    }

    const date = dayjs(iso);

    if (!date.isValid()) {
      return undefined;
    }

    return date.local().format('LLL');
  }

  function getNewsDateTime(article: ArticleDetailedResponse) {
    return article.publishDateTime ?? article.createdAt;
  }

  const {
    data: news,
    status,
    pending,
    refresh,
  } = await useAsyncData<Array<ArticleDetailedResponse>>(
    computed(() => `home-news-limit-${NEWS_LIMIT}`),
    async () => {
      const response = await $fetch<Array<ArticleDetailedResponse>>(
        '/api/v2/articles/search',
        {
          query: { cnt: NEWS_LIMIT },
        },
      );

      return Array.isArray(response) ? response : [];
    },
    {
      dedupe: 'defer',
      default: () => [],
    },
  );
</script>

<template>
  <UCard :ui="{ root: 'bg-muted', header: 'p-3 sm:p-3', body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-base leading-none font-medium">Новости</h3>

          <div class="text-xs leading-none text-gray-500">
            Последние: {{ NEWS_LIMIT }}
          </div>
        </div>

        <UButton
          :loading="pending"
          variant="soft"
          size="sm"
          @click="refresh()"
        >
          Обновить
        </UButton>
      </div>
    </template>

    <UAlert
      v-if="status === 'error'"
      title="Не удалось загрузить новости"
      description="Попробуйте обновить еще раз"
      class="rounded-none"
      variant="soft"
      color="error"
    />

    <div
      v-else
      class="flex flex-col divide-y divide-default"
    >
      <div
        v-for="article in news"
        :key="article.id"
        class="p-3"
      >
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <NuxtLink
              :to="article.url"
              class="block"
              aria-label="Открыть новость"
            >
              <div class="h-14 w-20 overflow-hidden rounded-lg bg-gray-200/60">
                <img
                  v-if="article.previewImageUrl"
                  :src="article.previewImageUrl"
                  :alt="article.title"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </NuxtLink>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <NuxtLink
                  :to="article.url"
                  class="block truncate font-medium hover:underline"
                >
                  {{ article.title }}
                </NuxtLink>

                <p
                  v-if="article.preview"
                  class="mt-1 line-clamp-2 text-sm text-gray-600"
                >
                  {{ article.preview }}
                </p>
              </div>

              <div class="shrink-0 text-right">
                <NuxtTime
                  :title="formatDateTime(getNewsDateTime(article))"
                  :datetime="getNewsDateTime(article)"
                  class="text-xs text-gray-500"
                  relative-style="long"
                  locale="ru-RU"
                  relative
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="news.length === 0 && status !== 'pending'"
        class="p-3 text-sm text-gray-600"
      >
        Новостей пока нет.
      </div>
    </div>
  </UCard>
</template>
