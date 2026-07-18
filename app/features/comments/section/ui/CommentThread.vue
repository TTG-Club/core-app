<script setup lang="ts">
  import type { CommentNode, CommentTreeActions } from '../../model';

  import { COMMENTS_MAX_VISUAL_DEPTH } from '../../model';
  import CommentCard from './CommentCard.vue';

  const {
    node,
    depth,
    actions,
    highlightedCommentId = null,
  } = defineProps<{
    node: CommentNode;
    /** Глубина в ветке: корни — 0. */
    depth: number;
    actions: CommentTreeActions;
    /** Комментарий, подсвеченный после перехода по якорной ссылке. */
    highlightedCommentId?: string | null;
  }>();

  const repliesVisible = computed(
    () => node.repliesLoaded && node.repliesExpanded && node.replies.length > 0,
  );

  /**
   * Линия под аватаром родителя рисуется только для развёрнутой ветки
   * с отступом; в плоской части (за лимитом глубины) линий нет.
   */
  const threadLineVisible = computed(
    () => repliesVisible.value && depth < COMMENTS_MAX_VISUAL_DEPTH,
  );

  /**
   * До лимита вложенности дети получают отступ под линию ветки, глубже —
   * рисуются «ровно», на уровне родителя (кому ответили — подпись
   * в карточке). Вертикальный отступ задан `pt-3` внутри контейнера, а не
   * gap-обёртки, чтобы линия ветки шла без разрывов.
   */
  const childrenContainerClass = computed(() =>
    depth < COMMENTS_MAX_VISUAL_DEPTH
      ? 'relative ml-3 flex flex-col gap-5 pt-4 pl-3 sm:pl-4'
      : 'flex flex-col gap-5 pt-4',
  );

  function handleToggleReplies(): void {
    void actions.toggleReplies(node);
  }
</script>

<template>
  <div class="relative flex flex-col">
    <CommentCard
      :node
      :actions
      :highlighted-comment-id="highlightedCommentId"
    />

    <div
      v-if="repliesVisible"
      :class="childrenContainerClass"
    >
      <!-- Единая кликабельная линия ветки: от карточки родителя до конца
           ответов по оси его аватара (12px); наведение подсвечивает всю
           линию, клик сворачивает ветку -->
      <button
        v-if="threadLineVisible"
        type="button"
        class="group absolute inset-y-0 left-0 flex w-4 cursor-pointer"
        aria-label="Свернуть ответы"
        @click.left.exact.prevent="handleToggleReplies"
      >
        <span
          class="h-full border-l-2 border-default transition-colors group-hover:border-primary"
        />
      </button>

      <CommentThread
        v-for="child in node.replies"
        :key="child.comment.id"
        :node="child"
        :depth="depth + 1"
        :actions
        :highlighted-comment-id="highlightedCommentId"
      />
    </div>
  </div>
</template>
