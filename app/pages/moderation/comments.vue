<script setup lang="ts">
  import type { CommentsModerationTab } from '~comments/model';

  import { SOURCE_PLATFORM_LABELS } from '#shared/consts';
  import { AdminCommentRow } from '~comments/admin';
  import {
    ADMIN_COMMENTS_ALL_DESCRIPTION,
    ADMIN_COMMENTS_ALL_EMPTY_MESSAGE,
    ADMIN_COMMENTS_DISLIKED_DESCRIPTION,
    ADMIN_COMMENTS_DISLIKED_EMPTY_MESSAGE,
    ADMIN_COMMENTS_PAGE_TITLE,
    ADMIN_COMMENTS_PLATFORM_ALL,
    ADMIN_COMMENTS_PLATFORM_ALL_LABEL,
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

  /**
   * Фильтр платформы-источника. Лента модерации общая на все сайты сервиса,
   * `ADMIN_COMMENTS_PLATFORM_ALL` снимает фильтр — тогда параметр на бэкенд не
   * уходит и возвращаются комментарии всех платформ.
   */
  const platformFilter = ref<string>(ADMIN_COMMENTS_PLATFORM_ALL);

  /** Пункты селекта: «все платформы» плюс список из общих подписей сервисов. */
  const platformOptions = computed(() => {
    const options = [
      {
        label: ADMIN_COMMENTS_PLATFORM_ALL_LABEL,
        value: ADMIN_COMMENTS_PLATFORM_ALL,
      },
    ];

    Object.entries(SOURCE_PLATFORM_LABELS).forEach(([value, label]) => {
      options.push({ label, value });
    });

    return options;
  });

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
          // «Все» — это отсутствие параметра: бэкенд трактует пустой фильтр
          // как «со всех платформ», а не как отдельную платформу.
          sourcePlatform:
            platformFilter.value === ADMIN_COMMENTS_PLATFORM_ALL
              ? undefined
              : platformFilter.value,
        },
      }).then(parseModerationCommentsPage),
    { watch: [currentPage, activeTab, platformFilter] },
  );

  // Смена вкладки или платформы начинает просмотр с первой страницы. Цикла нет:
  // вотчер меняет только currentPage, на источники он не влияет.
  watch([activeTab, platformFilter], () => {
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
      <div class="flex flex-wrap items-center gap-3">
        <UTabs
          v-model="activeTab"
          :items="COMMENTS_MODERATION_TABS"
          :content="false"
          size="sm"
          class="w-fit"
        />

        <!-- Фильтр по платформе: лента общая на все сайты сервиса -->
        <USelectMenu
          v-model="platformFilter"
          :items="platformOptions"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-44"
        />
      </div>

      <p class="text-sm text-muted">
        {{ pageDescription }}
      </p>

      <template v-if="isLoading">
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-20 w-full"
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
        <div class="flex flex-col gap-2">
          <AdminCommentRow
            v-for="comment in moderationComments"
            :key="comment.id"
            :comment="comment"
            @deleted="handleCommentChanged"
            @restored="handleCommentChanged"
            @stale="handleCommentChanged"
          />
        </div>

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
