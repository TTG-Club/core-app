<script setup lang="ts">
  import type { CommentsModerationTab } from '~comments/model';

  import { AdminCommentRow } from '~comments/admin';
  import {
    ADMIN_COMMENTS_ALL_DESCRIPTION,
    ADMIN_COMMENTS_ALL_EMPTY_MESSAGE,
    ADMIN_COMMENTS_DISLIKED_DESCRIPTION,
    ADMIN_COMMENTS_DISLIKED_EMPTY_MESSAGE,
    ADMIN_COMMENTS_PAGE_TITLE,
    COMMENTS_LOAD_ERROR_TOAST,
    COMMENTS_MODERATION_ALL_PATH,
    COMMENTS_MODERATION_DISLIKED_PATH,
    COMMENTS_MODERATION_PAGE_SIZE,
    COMMENTS_MODERATION_TABS,
    COMMENTS_RETRY_LABEL,
    getCommentErrorMessage,
    parseModerationCommentsPage,
  } from '~comments/model';
  import { UiResult } from '~ui/result';

  useSeoMeta({ title: ADMIN_COMMENTS_PAGE_TITLE });

  // useRequestFetch пробрасывает куки при SSR — иначе прокси не подставит
  // Bearer и сервис ответит 401 ещё на сервере.
  const requestFetch = useRequestFetch();

  const activeTab = ref<CommentsModerationTab>('disliked');

  const currentPage = ref(1);

  const moderationPath = computed(() =>
    activeTab.value === 'all'
      ? COMMENTS_MODERATION_ALL_PATH
      : COMMENTS_MODERATION_DISLIKED_PATH,
  );

  const {
    data: moderationPage,
    status: moderationStatus,
    error: moderationError,
    refresh: refreshModeration,
  } = await useAsyncData(
    'admin-comments-moderation',
    () =>
      requestFetch(moderationPath.value, {
        query: {
          page: currentPage.value - 1,
          size: COMMENTS_MODERATION_PAGE_SIZE,
        },
      }).then(parseModerationCommentsPage),
    { watch: [currentPage, activeTab] },
  );

  // Смена вкладки начинает просмотр с первой страницы. Цикла нет: вотчер
  // меняет только currentPage, на activeTab он не влияет.
  watch(activeTab, () => {
    currentPage.value = 1;
  });

  const isLoading = computed(() => moderationStatus.value === 'pending');

  const moderationComments = computed(() => moderationPage.value?.items ?? []);

  const totalModerationCount = computed(
    () => moderationPage.value?.totalElements ?? 0,
  );

  const loadErrorMessage = computed(() =>
    getCommentErrorMessage(moderationError.value),
  );

  const pageDescription = computed(() =>
    activeTab.value === 'all'
      ? ADMIN_COMMENTS_ALL_DESCRIPTION
      : ADMIN_COMMENTS_DISLIKED_DESCRIPTION,
  );

  const emptyMessage = computed(() =>
    activeTab.value === 'all'
      ? ADMIN_COMMENTS_ALL_EMPTY_MESSAGE
      : ADMIN_COMMENTS_DISLIKED_EMPTY_MESSAGE,
  );

  /** Повторяет загрузку ленты после ошибки. */
  function handleRetry(): void {
    void refreshModeration();
  }

  /**
   * Любое изменение статуса строки (удаление, восстановление, разошедшийся с
   * сервисом статус) перечитывает текущую страницу ленты.
   */
  function handleCommentChanged(): void {
    void refreshModeration();
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="ADMIN_COMMENTS_PAGE_TITLE"
  >
    <div class="flex flex-col gap-4">
      <UTabs
        v-model="activeTab"
        :items="COMMENTS_MODERATION_TABS"
        :content="false"
        size="sm"
        class="w-fit"
      />

      <p class="text-sm text-muted">
        {{ pageDescription }}
      </p>

      <template v-if="isLoading">
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-28 w-full"
        />
      </template>

      <UiResult
        v-else-if="moderationError"
        status="error"
        :title="COMMENTS_LOAD_ERROR_TOAST"
        :sub-title="loadErrorMessage"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="handleRetry">
            {{ COMMENTS_RETRY_LABEL }}
          </UButton>
        </template>
      </UiResult>

      <p
        v-else-if="moderationComments.length === 0"
        class="py-8 text-center text-sm text-muted"
      >
        {{ emptyMessage }}
      </p>

      <template v-else>
        <AdminCommentRow
          v-for="comment in moderationComments"
          :key="comment.id"
          :comment="comment"
          @deleted="handleCommentChanged"
          @restored="handleCommentChanged"
          @stale="handleCommentChanged"
        />

        <div
          v-if="totalModerationCount > COMMENTS_MODERATION_PAGE_SIZE"
          class="flex justify-center pt-2"
        >
          <UPagination
            v-model:page="currentPage"
            :total="totalModerationCount"
            :items-per-page="COMMENTS_MODERATION_PAGE_SIZE"
            show-edges
            :sibling-count="1"
          />
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
