<script setup lang="ts">
  import type { CommentNode, CommentTreeActions } from '../../model';

  import { useCommentTimestamp } from '../../composables';
  import {
    COMMENT_COPY_LINK_LABEL,
    COMMENT_REPLY_TO_PREFIX,
    COMMENT_RESTORE_FEED_TOOLTIP,
    COMMENT_RESTORE_LABEL,
    COMMENT_SHOW_PARENT_LABEL,
    COMMENT_TOMBSTONE_TEXT,
  } from '../../model';

  const {
    node,
    actions,
    replyToName = null,
  } = defineProps<{
    /** Узел-надгробие: удалённый комментарий с живой веткой ответов. */
    node: CommentNode;
    actions: CommentTreeActions;
    /** Имя автора родителя — подпись «кому отвечало» удалённое. */
    replyToName?: string | null;
  }>();

  const { copy } = useCopyAndShare();

  /**
   * Подпись «кому ответили» остаётся и у заглушки: в плоской части ветки
   * (за лимитом вложенности) без неё непонятно, к чему относятся ответы.
   */
  const replyToAuthorName = computed(
    () => replyToName ?? node.comment.parentAuthorName,
  );

  /**
   * Копирование ссылки и переход к родителю у заглушки сохранены: это не
   * действия над комментарием, сервис их не отбивает. Прямую ссылку на
   * надгробие он поддерживает — отдаёт заглушку вместо 404.
   */
  function copyCommentLink(): void {
    void copy(actions.getCommentLink(node.comment.id));
  }

  function showParentComment(): void {
    const { parentId } = node.comment;

    if (parentId) {
      actions.highlightComment(parentId);
    }
  }

  const { createdLabel, createdFullLabel } = useCommentTimestamp(
    () => node.comment,
  );

  const { canModerateComments } = useUserRoles();

  const isRestoring = ref(false);

  /**
   * Возвращает комментарий в опубликованные. Подтверждения не требует:
   * действие обратимо — комментарий всегда можно удалить снова (та же логика,
   * что в админской строке). Текст и автор придут вместе с ответом сервиса:
   * в публичных выдачах их не отдают, и это единственный способ их увидеть.
   */
  async function restore(): Promise<void> {
    isRestoring.value = true;

    try {
      await actions.restoreTombstone(node);
    } finally {
      isRestoring.value = false;
    }
  }
</script>

<template>
  <!--
    Заглушка на месте удалённого комментария. Аватар с иконкой вместо
    инициалов повторяет габарит обычной карточки — линия ветки идёт по той же
    оси. Из действий остались только те, что не трогают сам комментарий:
    ответ, жалобу и правку сервис отклоняет (409), поэтому их здесь нет.
  -->
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
    <UAvatar
      icon="tabler:trash"
      size="xs"
      class="shrink-0"
      aria-hidden="true"
    />

    <p class="min-w-0 text-sm text-muted italic">
      {{ COMMENT_TOMBSTONE_TEXT }}
    </p>

    <UTooltip
      v-if="createdLabel"
      :text="createdFullLabel"
    >
      <time
        class="text-xs whitespace-nowrap text-muted"
        :datetime="node.comment.createdAt"
      >
        {{ createdLabel }}
      </time>
    </UTooltip>

    <UTooltip :text="COMMENT_COPY_LINK_LABEL">
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="tabler:link"
        :aria-label="COMMENT_COPY_LINK_LABEL"
        @click.left.exact.prevent="copyCommentLink"
      />
    </UTooltip>

    <UTooltip
      v-if="node.comment.parentId"
      :text="COMMENT_SHOW_PARENT_LABEL"
    >
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="tabler:corner-left-up"
        :aria-label="COMMENT_SHOW_PARENT_LABEL"
        @click.left.exact.prevent="showParentComment"
      />
    </UTooltip>

    <!--
      Сдержаннее админской кнопки (там soft/success): в ленте заглушка не
      должна перетягивать внимание на себя у обычных читателей.
    -->
    <UTooltip
      v-if="canModerateComments"
      :text="COMMENT_RESTORE_FEED_TOOLTIP"
    >
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="tabler:arrow-back-up"
        :loading="isRestoring"
        :aria-label="COMMENT_RESTORE_LABEL"
        @click.left.exact.prevent="restore"
      />
    </UTooltip>
  </div>

  <p
    v-if="replyToAuthorName"
    class="flex items-center gap-1 text-xs text-muted"
  >
    <UIcon
      name="tabler:arrow-back-up"
      class="size-3.5 shrink-0"
      aria-hidden="true"
    />
    {{ COMMENT_REPLY_TO_PREFIX }} {{ replyToAuthorName }}
  </p>
</template>
