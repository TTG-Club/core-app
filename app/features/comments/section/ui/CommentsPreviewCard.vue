<script setup lang="ts">
  import type { CommentEntry } from '../../model';

  import { useCommentTimestamp } from '../../composables';

  const { comment } = defineProps<{
    comment: CommentEntry;
  }>();

  const { createdLabel, createdFullLabel } = useCommentTimestamp(() => comment);
</script>

<template>
  <article class="flex min-w-0 flex-col gap-1.5">
    <header class="flex items-center gap-2">
      <UAvatar
        :alt="comment.authorName"
        size="xs"
        class="shrink-0"
        :ui="{ fallback: 'uppercase' }"
      />

      <span class="min-w-0 truncate text-sm/6 font-semibold text-highlighted">
        {{ comment.authorName }}
      </span>

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
    </header>

    <p
      v-if="comment.parentAuthorName"
      class="flex items-center gap-1 text-xs text-muted"
    >
      <UIcon
        name="tabler:arrow-back-up"
        class="size-3.5 shrink-0"
      />
      в ответ {{ comment.parentAuthorName }}
    </p>

    <!-- Контент рендерится текстом: сервис не санитизирует ввод -->
    <p
      class="line-clamp-3 text-sm wrap-break-word whitespace-pre-line text-default"
    >
      {{ comment.content }}
    </p>
  </article>
</template>
