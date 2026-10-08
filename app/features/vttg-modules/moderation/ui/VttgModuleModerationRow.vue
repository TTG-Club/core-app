<script setup lang="ts">
  import type { ModuleSubmission } from '../../model';

  import {
    CARD_DATE_FORMAT,
    getModuleIcon,
    getModuleVersionLabel,
    getSubmissionAuthorLabel,
    MODERATION_ROW_CLASS,
    MODERATION_ROW_OPENED_CLASS,
  } from '../../model';
  import { VttgModuleStatusBadge } from '../../ui';

  /**
   * Строка очереди модерации: что за модуль, кто подал и в каком он статусе.
   * Подробности и решение — в карточке, которую строка открывает.
   */
  const { submission, isOpened = false } = defineProps<{
    submission: ModuleSubmission;
    /** Карточка этой заявки сейчас открыта. */
    isOpened?: boolean;
  }>();

  const emit = defineEmits<{
    select: [submissionId: string];
  }>();

  const { format } = useDayjs();

  const icon = computed(() => getModuleIcon(submission.module.icon));

  const moduleVersion = computed(() => getModuleVersionLabel(submission));

  const authorLabel = computed(() => getSubmissionAuthorLabel(submission));

  const submittedAt = computed(() =>
    format(submission.createdAt, CARD_DATE_FORMAT),
  );

  const rowClass = computed(() =>
    isOpened ? MODERATION_ROW_OPENED_CLASS : MODERATION_ROW_CLASS,
  );

  /** Просит открыть карточку заявки. */
  function select(): void {
    emit('select', submission.id);
  }
</script>

<template>
  <button
    type="button"
    class="flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition select-none"
    :class="rowClass"
    @click.left.exact.prevent="select"
  >
    <UIcon
      :name="icon"
      class="size-6 shrink-0 text-primary"
    />

    <span class="flex min-w-0 flex-1 flex-col">
      <span class="truncate text-sm font-medium text-highlighted">
        {{ submission.module.name }}
      </span>

      <span class="flex min-w-0 flex-wrap gap-x-3 text-xs text-muted">
        <span class="truncate font-mono">{{ moduleVersion }}</span>

        <span class="truncate">{{ authorLabel }}</span>
      </span>
    </span>

    <span
      class="hidden shrink-0 text-xs whitespace-nowrap text-dimmed sm:inline"
    >
      {{ submittedAt }}
    </span>

    <VttgModuleStatusBadge
      :status="submission.status"
      class="shrink-0"
    />
  </button>
</template>
