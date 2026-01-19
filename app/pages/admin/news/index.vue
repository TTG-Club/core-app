<script setup lang="ts">
  import { computed, ref } from 'vue';

  type ApiArticle = {
    id: string;
    url: string;
    title: string;
    publishDateTime: string;
    previewImageUrl: string;
    preview: string;
  };

  type NewsCard = {
    id: string;
    title: string;
    excerpt: string;
    url: string;
    publishedAt: string;
    coverUrl?: string;
  };

  const searchQuery = ref<string>('');

  const endpoint = '/api/v2/articles/search';

  const {
    data: apiArticles,
    pending: isLoading,
    error: newsError,
  } = await useFetch<Array<ApiArticle>>(endpoint, {
    default: () => [],
  });

  const normalizedCards = computed<Array<NewsCard>>(() => {
    const result: Array<NewsCard> = [];

    for (const article of apiArticles.value) {
      if (
        article.id.length === 0 ||
        article.url.length === 0 ||
        article.title.length === 0 ||
        article.publishDateTime.length === 0
      ) {
        continue;
      }

      result.push({
        id: article.id,
        title: article.title,
        excerpt: article.preview ?? '',
        url: article.url,
        publishedAt: article.publishDateTime,
        coverUrl: article.previewImageUrl || undefined,
      });
    }

    return result;
  });

  const filteredCards = computed<Array<NewsCard>>(() => {
    const query = searchQuery.value.trim().toLowerCase();

    if (query.length === 0) {
      return normalizedCards.value;
    }

    return normalizedCards.value.filter((card) => {
      return (
        card.title.toLowerCase().includes(query) ||
        card.excerpt.toLowerCase().includes(query)
      );
    });
  });

  const sortedCards = computed<Array<NewsCard>>(() => {
    const cardsCopy = [...filteredCards.value];

    cardsCopy.sort((leftCard, rightCard) => {
      const leftTime = new Date(leftCard.publishedAt).getTime();
      const rightTime = new Date(rightCard.publishedAt).getTime();

      if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
        return 0;
      }

      if (Number.isNaN(leftTime)) {
        return 1;
      }

      if (Number.isNaN(rightTime)) {
        return -1;
      }

      return rightTime - leftTime;
    });

    return cardsCopy;
  });

  const totalItems = computed<number>(() => sortedCards.value.length);

  const formatDate = (isoString: string): string => {
    const parsedDate = new Date(isoString);

    if (Number.isNaN(parsedDate.getTime())) {
      return isoString;
    }

    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    }).format(parsedDate);
  };
</script>

<template>
  <UContainer class="py-6">
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl leading-tight font-semibold">Новости</h1>
        </div>

        <UButton
          to="/admin/news/create"
          icon="i-heroicons-plus-20-solid"
          color="primary"
        >
          Создать
        </UButton>
      </div>

      <!-- Controls -->
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-12"></div>

      <!-- Meta -->
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Найдено:
        <span class="font-medium text-gray-900 dark:text-gray-100">
          {{ totalItems }}
        </span>
      </div>

      <!-- Error -->
      <div
        v-if="newsError"
        class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
      >
        Не удалось загрузить новости.
      </div>

      <!-- Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <template v-if="isLoading">
          <UCard
            v-for="skeletonIndex in 6"
            :key="`skeleton-${skeletonIndex}`"
            class="overflow-hidden"
          >
            <div class="flex flex-col gap-3">
              <USkeleton class="h-40 w-full" />

              <USkeleton class="h-5 w-32" />

              <USkeleton class="h-4 w-full" />

              <USkeleton class="h-4 w-4/5" />

              <USkeleton class="h-9 w-32" />
            </div>
          </UCard>
        </template>

        <template v-else>
          <UCard
            v-for="newsItem in sortedCards"
            :key="newsItem.id"
            class="group overflow-hidden"
          >
            <div class="flex h-full flex-col gap-3">
              <div
                v-if="newsItem.coverUrl"
                class="relative -mx-4 -mt-4"
              >
                <div class="aspect-[16/9] w-full overflow-hidden">
                  <img
                    :src="newsItem.coverUrl"
                    :alt="newsItem.title"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <UBadge
                  color="neutral"
                  variant="soft"
                >
                  Новость
                </UBadge>

                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(newsItem.publishedAt) }}
                </span>
              </div>

              <div class="flex flex-col gap-1">
                <a
                  :href="newsItem.url"
                  target="_blank"
                  rel="noreferrer"
                  class="text-base leading-snug font-semibold text-gray-900 hover:underline dark:text-gray-50"
                >
                  {{ newsItem.title }}
                </a>

                <p
                  class="line-clamp-3 text-sm text-gray-600 dark:text-gray-300"
                >
                  {{ newsItem.excerpt }}
                </p>
              </div>

              <div class="mt-auto flex justify-end pt-2">
                <UButton
                  :to="newsItem.url"
                  external
                  target="_blank"
                  color="primary"
                >
                  Открыть
                </UButton>
              </div>
            </div>
          </UCard>

          <div
            v-if="sortedCards.length === 0"
            class="col-span-full"
          >
            <UCard>
              <div class="py-10 text-center">
                <div class="font-semibold">Ничего не найдено</div>

                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Попробуйте изменить поисковый запрос.
                </div>
              </div>
            </UCard>
          </div>
        </template>
      </div>
    </div>
  </UContainer>
</template>
