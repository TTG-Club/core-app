<script setup lang="ts">
  import type { CommentEntry } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useCommentTimestamp } from '../../composables';
  import {
    ADMIN_COMMENT_DELETE_LABEL,
    ADMIN_COMMENT_DELETED_TOAST,
    ADMIN_COMMENT_OPEN_LABEL,
    ADMIN_COMMENT_REPLY_TO_FALLBACK,
    ADMIN_COMMENT_RESTORE_TOOLTIP,
    COMMENT_DELETE_BRANCH_WARNING,
    COMMENT_DELETE_CONFIRM_LABEL,
    COMMENT_DELETE_DIALOG_TITLE,
    COMMENT_DELETE_ERROR_TOAST,
    COMMENT_DELETE_IRREVERSIBLE_WARNING,
    COMMENT_DISLIKES_PLURAL_FORMS,
    COMMENT_REPLY_TO_PREFIX,
    COMMENT_RESTORE_ERROR_TOAST,
    COMMENT_RESTORE_LABEL,
    COMMENT_RESTORED_TOAST,
    COMMENT_STATUS_COLORS,
    COMMENT_STATUS_LABELS,
    deleteComment,
    getCommentAnchorId,
    getCommentErrorMessage,
    getCommentFetchStatus,
    restoreComment,
  } from '../../model';

  const { comment, dense = false } = defineProps<{
    /** Комментарий из модерационной ленты жалоб. */
    comment: CommentEntry;
    /** Плотная вёрстка для узкой панели: карточка соседствует с блоками детали. */
    dense?: boolean;
  }>();

  const emit = defineEmits<{
    /** Комментарий удалён — списку пора перечитаться. */
    (event: 'deleted', commentId: string): void;
    /** Комментарий восстановлен — сервис вернул актуальную запись. */
    (event: 'restored', restored: CommentEntry): void;
    /** Локальный статус разошёлся с сервисом — списку нужна перезагрузка. */
    (event: 'stale'): void;
  }>();

  /** Отступы карточки: в узкой панели стандартные p-6 съедают содержимое. */
  const cardUi = computed(() => (dense ? { body: 'p-3 sm:p-4' } : undefined));

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
      ? `${COMMENT_REPLY_TO_PREFIX} ${comment.parentAuthorName}`
      : ADMIN_COMMENT_REPLY_TO_FALLBACK;
  });

  const toast = useToast();

  const isDeleteOpen = ref(false);
  const isDeleting = ref(false);
  const isRestoring = ref(false);

  /**
   * Удалённый комментарий второй раз не удалить — кнопку прячем. Скрытый баном
   * автора удалить можно: сервис такое удаление обрабатывает корректно.
   */
  const showDeleteButton = computed(() => comment.status !== 'DELETED');

  /**
   * Восстановить можно только мягко удалённый комментарий: на любой другой
   * статус сервис отвечает 409. Скрытие баном снимается разблокировкой автора.
   */
  const showRestoreButton = computed(() => comment.status === 'DELETED');

  const deleteDescription = computed(() =>
    comment.replyCount > 0
      ? COMMENT_DELETE_BRANCH_WARNING
      : COMMENT_DELETE_IRREVERSIBLE_WARNING,
  );

  function openDelete(): void {
    isDeleteOpen.value = true;
  }

  async function confirmDelete(): Promise<void> {
    isDeleting.value = true;

    try {
      await deleteComment(comment.id);

      toast.add({
        title: ADMIN_COMMENT_DELETED_TOAST,
        color: 'success',
        icon: 'tabler:trash',
      });

      isDeleteOpen.value = false;
      emit('deleted', comment.id);
    } catch (error) {
      toast.add({
        title: COMMENT_DELETE_ERROR_TOAST,
        description: getCommentErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Восстановление подтверждения не требует: действие обратимо — комментарий
   * всегда можно удалить снова.
   */
  async function restore(): Promise<void> {
    isRestoring.value = true;

    try {
      const restored = await restoreComment(comment.id);

      toast.add({
        title: COMMENT_RESTORED_TOAST,
        color: 'success',
        icon: 'tabler:arrow-back-up',
      });

      emit('restored', restored);
    } catch (error) {
      toast.add({
        title: COMMENT_RESTORE_ERROR_TOAST,
        description: getCommentErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      // 409 = комментарий уже не в статусе DELETED: его успел тронуть другой
      // модератор, и наша строка показывает устаревший статус.
      if (getCommentFetchStatus(error) === 409) {
        emit('stale');
      }
    } finally {
      isRestoring.value = false;
    }
  }
</script>

<template>
  <UCard
    variant="subtle"
    :ui="cardUi"
  >
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
            {{ ADMIN_COMMENT_OPEN_LABEL }}
          </UButton>

          <UTooltip
            v-if="showRestoreButton"
            :text="ADMIN_COMMENT_RESTORE_TOOLTIP"
          >
            <UButton
              size="xs"
              variant="soft"
              color="success"
              icon="tabler:arrow-back-up"
              :loading="isRestoring"
              :aria-label="COMMENT_RESTORE_LABEL"
              @click.left.exact.prevent="restore"
            />
          </UTooltip>

          <UTooltip
            v-if="showDeleteButton"
            :text="ADMIN_COMMENT_DELETE_LABEL"
          >
            <UButton
              size="xs"
              variant="soft"
              color="error"
              icon="tabler:trash"
              :aria-label="ADMIN_COMMENT_DELETE_LABEL"
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
          aria-hidden="true"
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
      :title="COMMENT_DELETE_DIALOG_TITLE"
      :description="deleteDescription"
      :confirm-label="COMMENT_DELETE_CONFIRM_LABEL"
      confirm-color="error"
      confirm-icon="tabler:trash"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </UCard>
</template>
