<script setup lang="ts">
  import type { ModuleSubmission } from '../../model';

  import {
    EDIT_ICON,
    EDIT_LABEL,
    isSubmissionClosed,
    isSubmissionEditable,
    REFRESH_MANIFEST_ICON,
    REFRESH_MANIFEST_LABEL,
    WITHDRAW_ICON,
    WITHDRAW_LABEL,
  } from '../../model';
  import { VttgModuleSummary } from '../../ui';

  /** Заявка автора с его действиями: правка, перечитывание манифеста, отзыв. */
  const { submission, busy = false } = defineProps<{
    submission: ModuleSubmission;
    /** Идёт запрос по одной из заявок — кнопки ждут. */
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    edit: [submission: ModuleSubmission];
    refresh: [submissionId: string];
    withdraw: [submissionId: string];
  }>();

  const isEditable = computed(() => isSubmissionEditable(submission.status));
  const isActive = computed(() => !isSubmissionClosed(submission.status));

  /** Открывает правку заявки. */
  function edit(): void {
    emit('edit', submission);
  }

  /** Просит перечитать манифест заявки. */
  function refresh(): void {
    emit('refresh', submission.id);
  }

  /** Просит отозвать заявку. */
  function withdraw(): void {
    emit('withdraw', submission.id);
  }
</script>

<template>
  <VttgModuleSummary :submission>
    <template #actions>
      <UButton
        v-if="isEditable"
        :icon="EDIT_ICON"
        size="sm"
        variant="soft"
        :disabled="busy"
        @click.left.exact.prevent="edit"
      >
        {{ EDIT_LABEL }}
      </UButton>

      <UButton
        v-if="isActive"
        :icon="REFRESH_MANIFEST_ICON"
        size="sm"
        variant="soft"
        color="neutral"
        :disabled="busy"
        @click.left.exact.prevent="refresh"
      >
        {{ REFRESH_MANIFEST_LABEL }}
      </UButton>

      <UButton
        v-if="isActive"
        :icon="WITHDRAW_ICON"
        size="sm"
        variant="ghost"
        color="error"
        :disabled="busy"
        @click.left.exact.prevent="withdraw"
      >
        {{ WITHDRAW_LABEL }}
      </UButton>
    </template>
  </VttgModuleSummary>
</template>
