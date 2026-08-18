<script setup lang="ts">
  import { UiPagination } from '~ui/pagination';

  import {
    COMMENTS_RETRY_LABEL,
    RECENT_COMMENTS_DESCRIPTION,
    RECENT_COMMENTS_EMPTY_TEXT,
    RECENT_COMMENTS_EMPTY_TITLE,
    RECENT_COMMENTS_LOAD_ERROR_TEXT,
    RECENT_COMMENTS_PAGE_SIZE,
    RECENT_COMMENTS_TITLE,
  } from '../model';
  import { useRecentComments } from './composables';
  import { RecentCommentCard } from './ui';

  const { comments, currentPage, totalCount, isLoading, hasError, reload } =
    useRecentComments();

  const isEmpty = computed(
    () => !isLoading.value && comments.value.length === 0,
  );

  /** Повторяет загрузку ленты после ошибки. */
  function handleRetry(): void {
    void reload();
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="RECENT_COMMENTS_TITLE"
  >
    <div class="flex flex-col gap-4">
      <p class="text-sm leading-relaxed text-secondary">
        {{ RECENT_COMMENTS_DESCRIPTION }}
      </p>

      <!-- Загрузка -->
      <div
        v-if="isLoading"
        class="flex flex-col gap-3"
      >
        <USkeleton
          v-for="index in 5"
          :key="index"
          class="h-28 w-full rounded-xl"
        />
      </div>

      <!-- Ошибка загрузки -->
      <div
        v-else-if="hasError"
        class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default bg-elevated p-8 text-center"
      >
        <p class="text-sm text-error">{{ RECENT_COMMENTS_LOAD_ERROR_TEXT }}</p>

        <UButton
          :label="COMMENTS_RETRY_LABEL"
          color="neutral"
          variant="outline"
          size="sm"
          icon="tabler:refresh"
          @click.left.exact.prevent="handleRetry"
        />
      </div>

      <!-- Пустое состояние -->
      <div
        v-else-if="isEmpty"
        class="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-default bg-elevated p-8"
      >
        <UEmpty
          icon="tabler:message-off"
          :title="RECENT_COMMENTS_EMPTY_TITLE"
          :description="RECENT_COMMENTS_EMPTY_TEXT"
        />
      </div>

      <!-- Лента -->
      <div
        v-else
        class="flex flex-col gap-3"
      >
        <RecentCommentCard
          v-for="comment in comments"
          :key="comment.id"
          :comment
        />

        <UiPagination
          v-if="totalCount > RECENT_COMMENTS_PAGE_SIZE"
          v-model:page="currentPage"
          class="pt-2"
          :total="totalCount"
          :items-per-page="RECENT_COMMENTS_PAGE_SIZE"
        />
      </div>
    </div>
  </NuxtLayout>
</template>
