<script setup lang="ts">
  import { useCommentTimestamp } from '../../composables';
  import { COMMENT_TOMBSTONE_TEXT } from '../../model';

  const props = defineProps<{
    /** Имя автора ответа; `null` — надгробие удалённого */
    authorName: string | null;

    /** Текст ответа; `null` — надгробие удалённого */
    content: string | null;

    /** Дата ответа */
    createdAt: string;
  }>();

  const { createdLabel, createdFullLabel } = useCommentTimestamp(() => ({
    createdAt: props.createdAt,
  }));

  const isTombstone = computed(() => props.content == null);
</script>

<template>
  <div class="space-y-1">
    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        v-if="authorName"
        class="text-sm font-medium text-highlighted"
      >
        {{ authorName }}
      </span>

      <span
        class="text-xs text-muted"
        :title="createdFullLabel"
      >
        {{ createdLabel }}
      </span>
    </div>

    <p
      v-if="isTombstone"
      class="text-sm text-muted italic"
    >
      {{ COMMENT_TOMBSTONE_TEXT }}
    </p>

    <p
      v-else
      class="text-sm leading-relaxed break-words whitespace-pre-wrap text-secondary"
    >
      {{ content }}
    </p>
  </div>
</template>
