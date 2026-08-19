<script setup lang="ts">
  import type { CommentEntry } from '../../model';

  import { useCommentLocation, useCommentTimestamp } from '../../composables';
  import { COMMENT_REPLY_TO_PREFIX } from '../../model';

  const props = defineProps<{
    /** Комментарий из ленты сайта */
    comment: CommentEntry;
  }>();

  const { createdLabel, createdFullLabel } = useCommentTimestamp(
    () => props.comment,
  );

  // Без адреса страницы (старые сборки сервиса его не присылали) вести некуда —
  // карточка стала бы нерабочей ссылкой, поэтому её просто не показывают.
  const { sectionLabel, commentLink } = useCommentLocation(() => props.comment);
</script>

<template>
  <NuxtLink
    v-if="commentLink"
    :to="commentLink"
    class="flex flex-col gap-2 rounded-xl border border-default bg-default p-4 shadow-sm transition-colors hover:border-accented hover:bg-elevated"
  >
    <!-- Метка раздела вынесена из переносимой группы: внутри неё длинное имя
      автора сталкивало её на вторую строку, и она повисала справа в пустоте -->
    <div class="flex items-start gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span class="text-sm font-medium text-highlighted">
          {{ comment.authorName }}
        </span>

        <span
          class="text-xs text-muted"
          :title="createdFullLabel"
        >
          {{ createdLabel }}
        </span>

        <span
          v-if="comment.parentAuthorName"
          class="text-xs text-muted"
        >
          {{ COMMENT_REPLY_TO_PREFIX }} {{ comment.parentAuthorName }}
        </span>
      </div>

      <UBadge
        :label="sectionLabel"
        color="neutral"
        variant="subtle"
        size="sm"
        class="ml-auto shrink-0"
      />
    </div>

    <p
      class="line-clamp-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-secondary"
    >
      {{ comment.content }}
    </p>
  </NuxtLink>
</template>
