<script setup lang="ts">
  import type { MyComment } from '../model';

  import { UiPagination } from '~ui/pagination';

  import {
    COMMENTS_RETRY_LABEL,
    MY_COMMENTS_DESCRIPTION,
    MY_COMMENTS_EMPTY_FILTERED_TEXT,
    MY_COMMENTS_EMPTY_FILTERED_TITLE,
    MY_COMMENTS_EMPTY_TEXT,
    MY_COMMENTS_EMPTY_TITLE,
    MY_COMMENTS_LOAD_ERROR_TEXT,
    MY_COMMENTS_PAGE_SIZE,
    MY_COMMENTS_TITLE,
  } from '../model';
  import { useMyComments, useMyCommentUpdates } from './composables';
  import { MyCommentCard, MyCommentsFilters } from './ui';

  const {
    comments,
    currentPage,
    filter,
    totalCount,
    isLoading,
    hasError,
    reload,
  } = useMyComments();

  const { newReplyCount, markSeenUpTo } = useMyCommentUpdates();

  /**
   * Комментарии, чьи ответы просмотрены прямо сейчас. Отметка просмотра общая
   * и уезжает вперёд рывками, а бейдж должен гаснуть на той карточке, которую
   * прочитали, — поэтому прочитанное за сессию помнится поштучно. На следующий
   * заход список приедет уже с нулевым счётчиком новых ответов.
   */
  const readCommentIds = ref(new Set<string>());

  /**
   * Есть ли у комментария непросмотренные ответы.
   *
   * @param comment Комментарий пользователя.
   */
  function isUnread(comment: MyComment): boolean {
    return comment.newReplyCount > 0 && !readCommentIds.value.has(comment.id);
  }

  /**
   * Карточку рассмотрели: гасим её бейдж и двигаем общую отметку просмотра —
   * вместе с ней гаснут точки у вкладки, шлема и в его меню.
   *
   * @param comment Просмотренный комментарий.
   */
  function handleRead(comment: MyComment): void {
    if (comment.newReplyCount > 0) {
      readCommentIds.value = new Set(readCommentIds.value).add(comment.id);
    }

    markSeenUpTo(comment.lastReplyAt);
  }

  const isEmpty = computed(
    () => !isLoading.value && comments.value.length === 0,
  );

  const isFiltered = computed(() => filter.value !== 'ALL');

  const emptyTitle = computed(() =>
    isFiltered.value
      ? MY_COMMENTS_EMPTY_FILTERED_TITLE
      : MY_COMMENTS_EMPTY_TITLE,
  );

  const emptyText = computed(() =>
    isFiltered.value ? MY_COMMENTS_EMPTY_FILTERED_TEXT : MY_COMMENTS_EMPTY_TEXT,
  );

  /** Повторяет загрузку списка после ошибки. */
  function handleRetry(): void {
    void reload();
  }
</script>

<template>
  <div class="space-y-6">
    <UCard :ui="{ header: 'px-6 py-4', body: 'p-6' }">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:message-circle"
            class="h-5 w-5 text-primary"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">{{ MY_COMMENTS_TITLE }}</h3>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm leading-relaxed text-secondary">
          {{ MY_COMMENTS_DESCRIPTION }}
        </p>

        <MyCommentsFilters
          v-model="filter"
          :new-reply-count="newReplyCount"
        />
      </div>
    </UCard>

    <!-- Загрузка -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-32 w-full rounded-xl"
      />
    </div>

    <!-- Ошибка загрузки -->
    <div
      v-else-if="hasError"
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default bg-elevated p-8 text-center"
    >
      <p class="text-sm text-error">{{ MY_COMMENTS_LOAD_ERROR_TEXT }}</p>

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
        :title="emptyTitle"
        :description="emptyText"
      />
    </div>

    <!-- Список своих комментариев -->
    <div
      v-else
      class="space-y-3"
    >
      <MyCommentCard
        v-for="comment in comments"
        :key="comment.id"
        :comment
        :is-unread="isUnread(comment)"
        @read="handleRead"
      />

      <UiPagination
        v-if="totalCount > MY_COMMENTS_PAGE_SIZE"
        v-model:page="currentPage"
        class="pt-2"
        :total="totalCount"
        :items-per-page="MY_COMMENTS_PAGE_SIZE"
      />
    </div>
  </div>
</template>
