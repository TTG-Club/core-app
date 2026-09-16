<script setup lang="ts">
  import type { CreateGameReportRequest, GameReportReason } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import {
    CANCEL_LABEL,
    GAME_REPORT_DESCRIPTION,
    GAME_REPORT_DETAILS_LABEL,
    GAME_REPORT_DETAILS_PLACEHOLDER,
    GAME_REPORT_MAX_DETAILS_LENGTH,
    GAME_REPORT_REASON_LABEL,
    GAME_REPORT_REASON_LABELS,
    GAME_REPORT_REASONS,
    GAME_REPORT_SUBMIT_LABEL,
    GAME_REPORT_TITLE,
  } from '../../model';

  const isOpen = defineModel<boolean>('open', { required: true });

  const { loading = false } = defineProps<{
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: CreateGameReportRequest];
  }>();

  const reason = ref<GameReportReason>(GAME_REPORT_REASONS[0]);
  const details = ref('');

  const reasonOptions = GAME_REPORT_REASONS.map((reasonValue) => ({
    label: GAME_REPORT_REASON_LABELS[reasonValue],
    value: reasonValue,
  }));

  // Окно живёт вместе со страницей, поэтому поля чистятся при каждом открытии —
  // иначе текст прошлой жалобы подставится в следующую.
  watch(isOpen, (opened) => {
    if (opened) {
      reason.value = GAME_REPORT_REASONS[0];
      details.value = '';
    }
  });

  /** Закрывает окно, не отправляя жалобу. */
  function close(): void {
    isOpen.value = false;
  }

  /** Отправляет нормализованные данные жалобы родительской странице. */
  function submit(): void {
    emit('submit', {
      reason: reason.value,
      details: details.value.trim() || null,
    });
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="GAME_REPORT_TITLE"
    :description="GAME_REPORT_DESCRIPTION"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          :label="GAME_REPORT_REASON_LABEL"
          required
        >
          <USelect
            v-model="reason"
            :items="reasonOptions"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="GAME_REPORT_DETAILS_LABEL">
          <UTextarea
            v-model="details"
            :maxlength="GAME_REPORT_MAX_DETAILS_LENGTH"
            :placeholder="GAME_REPORT_DETAILS_PLACEHOLDER"
            :disabled="loading"
            autoresize
            :maxrows="6"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="CANCEL_LABEL"
        :submit-label="GAME_REPORT_SUBMIT_LABEL"
        submit-icon="tabler:flag"
        submit-color="error"
        :loading="loading"
        @cancel="close"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
