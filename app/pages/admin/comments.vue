<script setup lang="ts">
  import type { CommentsModerationTab } from '~comments/model';

  import { AdminCommentRow } from '~comments/admin';
  import {
    COMMENTS_MODERATION_ALL_PATH,
    COMMENTS_MODERATION_DISLIKED_PATH,
    COMMENTS_MODERATION_PAGE_SIZE,
    COMMENTS_MODERATION_TABS,
    getCommentErrorMessage,
    parseCommentsPage,
  } from '~comments/model';
  import { UiResult } from '~ui/result';

  const PAGE_TITLE = 'Комментарии: Модерация';

  useSeoMeta({ title: PAGE_TITLE });

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
      }).then(parseCommentsPage),
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
      ? 'Все комментарии сайта — от новых к старым, включая удалённые и отклонённые.'
      : 'Комментарии, на которые пользователи отправили жалобы, — от самых обжалуемых к менее. Ссылка «Открыть» ведёт к комментарию на его странице.',
  );

  const emptyMessage = computed(() =>
    activeTab.value === 'all'
      ? 'Комментариев пока нет.'
      : 'Жалоб нет — очередь модерации пуста.',
  );

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
    :title="PAGE_TITLE"
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
        title="Не удалось загрузить комментарии"
        :sub-title="loadErrorMessage"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="handleRetry">
            Попробовать снова
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
