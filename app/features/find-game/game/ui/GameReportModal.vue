<script setup lang="ts">
  import type { CreateGameReportRequest, GameReportReason } from '../../model';

  import {
    GAME_REPORT_CANCEL_LABEL,
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
      <form
        class="flex flex-col gap-4"
        @submit.prevent="submit"
      >
        <UFormField
          :label="GAME_REPORT_REASON_LABEL"
          required
        >
          <USelect
            v-model="reason"
            :items="reasonOptions"
            :disabled="loading"
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
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="loading"
            @click.left.exact.prevent="isOpen = false"
          >
            {{ GAME_REPORT_CANCEL_LABEL }}
          </UButton>

          <UButton
            type="submit"
            color="error"
            icon="tabler:flag"
            :loading="loading"
            :label="GAME_REPORT_SUBMIT_LABEL"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
