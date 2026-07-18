<script setup lang="ts">
  import type { CommentEntry } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useCommentTimestamp } from '../../composables';
  import {
    COMMENT_DISLIKES_PLURAL_FORMS,
    COMMENT_STATUS_COLORS,
    COMMENT_STATUS_LABELS,
    deleteComment,
    getCommentAnchorId,
    getCommentErrorMessage,
  } from '../../model';

  const { comment } = defineProps<{
    /** Комментарий из модерационной ленты жалоб. */
    comment: CommentEntry;
  }>();

  const emit = defineEmits<{
    /** Комментарий удалён — списку пора перечитаться. */
    (event: 'deleted'): void;
  }>();

  const { createdLabel, createdFullLabel } = useCommentTimestamp(() => comment);

  /**
   * Якорная ссылка на комментарий на канонической странице обсуждения —
   * переход раскрывает ветку и подсвечивает цель (deep-link ленты).
   * Старые записи без `url` открыть не получится.
   */
  const commentPageLink = computed(() =>
    comment.url ? `${comment.url}#${getCommentAnchorId(comment.id)}` : null,
  );

  const statusLabel = computed(() => COMMENT_STATUS_LABELS[comment.status]);

  const statusColor = computed(() => COMMENT_STATUS_COLORS[comment.status]);

  const dislikesLabel = computed(
    () =>
      `${comment.dislikeCount} ${getPlural(comment.dislikeCount, COMMENT_DISLIKES_PLURAL_FORMS)}`,
  );

  /**
   * Подпись «это ответ» — как в пользовательской ленте. Если сервис не
   * прислал имя автора родителя, остаётся нейтральная подпись.
   */
  const replyToLabel = computed(() => {
    if (!comment.parentId) {
      return null;
    }

    return comment.parentAuthorName
      ? `в ответ ${comment.parentAuthorName}`
      : 'ответ на комментарий';
  });

  const toast = useToast();

  const isDeleteOpen = ref(false);
  const isDeleting = ref(false);

  /** Удалённый комментарий второй раз не удалить — кнопку прячем. */
  const showDeleteButton = computed(() => comment.status !== 'DELETED');

  const deleteDescription = computed(() =>
    comment.replyCount > 0
      ? 'Ответы этой ветки тоже перестанут отображаться.'
      : 'Действие нельзя отменить.',
  );

  function openDelete(): void {
    isDeleteOpen.value = true;
  }

  async function confirmDelete(): Promise<void> {
    isDeleting.value = true;

    try {
      await deleteComment(comment.id);

      toast.add({
        title: 'Комментарий удалён',
        color: 'success',
        icon: 'tabler:trash',
      });

      isDeleteOpen.value = false;
      emit('deleted');
    } catch (error) {
      toast.add({
        title: 'Не удалось удалить комментарий',
        description: getCommentErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isDeleting.value = false;
    }
  }
</script>

<template>
  <UCard variant="subtle">
    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <UAvatar
          :alt="comment.authorName"
          size="xs"
          class="shrink-0"
          :ui="{ fallback: 'uppercase' }"
        />

        <span class="min-w-0 truncate text-sm font-semibold text-highlighted">
          {{ comment.authorName }}
        </span>

        <!-- В ленте «Все комментарии» без жалоб бейдж не показывается -->
        <UBadge
          v-if="comment.dislikeCount > 0"
          color="error"
          variant="subtle"
          size="sm"
          icon="tabler:flag"
        >
          {{ dislikesLabel }}
        </UBadge>

        <UBadge
          :color="statusColor"
          variant="subtle"
          size="sm"
        >
          {{ statusLabel }}
        </UBadge>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <UTooltip
            v-if="createdLabel"
            :text="createdFullLabel"
          >
            <time
              class="text-xs whitespace-nowrap text-muted"
              :datetime="comment.createdAt"
            >
              {{ createdLabel }}
            </time>
          </UTooltip>

          <UButton
            v-if="commentPageLink"
            size="xs"
            variant="soft"
            color="neutral"
            icon="tabler:external-link"
            target="_blank"
            :to="commentPageLink"
          >
            Открыть
          </UButton>

          <UTooltip
            v-if="showDeleteButton"
            text="Удалить комментарий"
          >
            <UButton
              size="xs"
              variant="soft"
              color="error"
              icon="tabler:trash"
              aria-label="Удалить комментарий"
              @click.left.exact.prevent="openDelete"
            />
          </UTooltip>
        </div>
      </div>

      <p
        v-if="replyToLabel"
        class="flex items-center gap-1 text-xs text-muted"
      >
        <UIcon
          name="tabler:arrow-back-up"
          class="size-3.5 shrink-0"
        />
        {{ replyToLabel }}
      </p>

      <!-- Контент рендерится текстом: сервис не санитизирует ввод -->
      <p
        class="line-clamp-3 text-sm wrap-break-word whitespace-pre-line text-default"
      >
        {{ comment.content }}
      </p>
    </div>

    <ConfirmDialog
      v-model:open="isDeleteOpen"
      title="Удалить комментарий?"
      :description="deleteDescription"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </UCard>
</template>
