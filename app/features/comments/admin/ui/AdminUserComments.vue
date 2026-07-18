<script setup lang="ts">
  import type { UserCommentsTab } from '../../model';

  import { useUserComments } from '../../composables';
  import {
    COMMENTS_LOAD_ERROR_TOAST,
    getLoadedCountLabel,
    USER_COMMENTS_EMPTY_MESSAGE,
    USER_COMMENTS_EMPTY_TAB_MESSAGES,
    USER_COMMENTS_LOAD_MORE_LABEL,
    USER_COMMENTS_LOADING_LABEL,
    USER_COMMENTS_PARTIAL_EMPTY_TAB_MESSAGES,
    USER_COMMENTS_RETRY_LABEL,
    USER_COMMENTS_SECTION_TITLE,
    USER_COMMENTS_TABS,
  } from '../../model';
  import AdminCommentRow from './AdminCommentRow.vue';

  const props = defineProps<{
    /** UUID автора — тот же идентификатор, что и клейм `sub` в JWT. */
    authorId: string;
  }>();

  const {
    comments,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    isPartiallyLoaded,
    loadError,
    loadErrorMessage,
    load,
    loadMore,
    markCommentDeleted,
    replaceComment,
  } = useUserComments(() => props.authorId);

  const activeTab = ref<UserCommentsTab>('published');

  // Блок постоянный; список грузим при монтировании. Деталь пересобирается
  // по :key="user.id", поэтому onMounted срабатывает заново на каждого
  // выбранного пользователя.
  onMounted(load);

  const publishedComments = computed(() =>
    comments.value.filter((comment) => comment.status === 'PUBLISHED'),
  );

  const deletedComments = computed(() =>
    comments.value.filter((comment) => comment.status === 'DELETED'),
  );

  const tabCounts = computed<Record<UserCommentsTab, number>>(() => ({
    published: publishedComments.value.length,
    deleted: deletedComments.value.length,
    all: comments.value.length,
  }));

  /**
   * Счётчик уходит в `badge`, а не в текст подписи: в узкой панели подпись
   * обрезается по `truncate` и первым потерялось бы как раз число.
   */
  const tabItems = computed(() =>
    USER_COMMENTS_TABS.map((tab) => ({
      label: tab.label,
      value: tab.value,
      badge: tabCounts.value[tab.value],
    })),
  );

  /**
   * Вкладка «Все» показывает и прочие статусы (спам, отклонённые, скрытые
   * баном) — иначе они пропали бы из админки совсем.
   */
  const visibleComments = computed(() => {
    if (activeTab.value === 'published') {
      return publishedComments.value;
    }

    if (activeTab.value === 'deleted') {
      return deletedComments.value;
    }

    return comments.value;
  });

  /**
   * Пока загружена не вся лента, отсутствие во вкладке не значит отсутствия
   * вообще — формулировка не должна утверждать больше, чем известно.
   */
  const emptyTabMessage = computed(() =>
    isPartiallyLoaded.value
      ? USER_COMMENTS_PARTIAL_EMPTY_TAB_MESSAGES[activeTab.value]
      : USER_COMMENTS_EMPTY_TAB_MESSAGES[activeTab.value],
  );

  /**
   * Счётчики вкладок считаются по загруженному. Пока оно расходится с общим
   * числом, показываем расхождение явно — иначе бейдж в заголовке и суммы
   * вкладок противоречат друг другу без объяснения.
   */
  const loadedCountLabel = computed(() =>
    getLoadedCountLabel(comments.value.length, totalCount.value),
  );
</script>

<template>
  <div class="space-y-4">
    <!-- Заголовок секции -->
    <div class="flex items-center gap-2">
      <UIcon
        name="tabler:message-circle"
        class="size-5 text-primary"
        aria-hidden="true"
      />

      <span class="text-sm font-medium text-highlighted">
        {{ USER_COMMENTS_SECTION_TITLE }}
      </span>

      <UBadge
        v-if="!isLoading && !loadError && totalCount"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        {{ totalCount }}
      </UBadge>
    </div>

    <!-- Загрузка -->
    <div
      v-if="isLoading"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="tabler:loader-2"
        class="size-5 animate-spin"
        aria-hidden="true"
      />
      {{ USER_COMMENTS_LOADING_LABEL }}
    </div>

    <template v-else>
      <!-- Ошибка: пустой список без неё читается как «комментариев нет» -->
      <div
        v-if="loadError"
        class="flex flex-col items-start gap-2"
      >
        <p class="text-sm text-error">{{ COMMENTS_LOAD_ERROR_TOAST }}</p>

        <p
          v-if="loadErrorMessage"
          class="text-xs text-muted"
        >
          {{ loadErrorMessage }}
        </p>

        <UButton
          size="xs"
          variant="soft"
          color="neutral"
          icon="tabler:refresh"
          @click.left.exact.prevent="load"
        >
          {{ USER_COMMENTS_RETRY_LABEL }}
        </UButton>
      </div>

      <p
        v-else-if="!comments.length"
        class="text-sm text-muted"
      >
        {{ USER_COMMENTS_EMPTY_MESSAGE }}
      </p>

      <template v-else>
        <UTabs
          v-model="activeTab"
          :items="tabItems"
          :content="false"
          size="sm"
          class="w-fit"
        />

        <p
          v-if="!visibleComments.length"
          class="text-sm text-muted"
        >
          {{ emptyTabMessage }}
        </p>

        <div
          v-else
          class="flex flex-col gap-2"
        >
          <AdminCommentRow
            v-for="comment in visibleComments"
            :key="comment.id"
            :comment="comment"
            dense
            @deleted="markCommentDeleted"
            @restored="replaceComment"
            @stale="load"
          />
        </div>
      </template>

      <!--
        Догрузка живёт вне ветки со списком: расхождение надо показывать и
        когда список пуст (например, записи отсеялись при разборе).
      -->
      <div
        v-if="!loadError && isPartiallyLoaded"
        class="flex flex-col items-center gap-1 pt-1"
      >
        <UButton
          v-if="hasMore"
          size="xs"
          variant="soft"
          color="neutral"
          :loading="isLoadingMore"
          @click.left.exact.prevent="loadMore"
        >
          {{ USER_COMMENTS_LOAD_MORE_LABEL }}
        </UButton>

        <span class="text-xs text-muted">{{ loadedCountLabel }}</span>
      </div>
    </template>
  </div>
</template>
