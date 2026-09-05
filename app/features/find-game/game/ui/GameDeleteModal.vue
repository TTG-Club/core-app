<script setup lang="ts">
  import {
    CANCEL_LABEL,
    GAME_DELETE_CONFIRM_DESCRIPTION,
    GAME_DELETE_CONFIRM_TITLE,
    GAME_DELETE_LABEL,
    GAME_DELETE_REASON_LABEL,
    GAME_DELETE_REASON_PLACEHOLDER,
    GAME_DELETION_REASON_MAX_LENGTH,
  } from '../../model';

  const isOpen = defineModel<boolean>('open', { required: true });

  const { loading = false } = defineProps<{
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    confirm: [reason: string];
  }>();

  const reason = ref('');

  // Сервис принимает причину от 1 до 1000 символов, поэтому пустую отправлять
  // нельзя: она уйдёт в 400 вместо удаления.
  const isValid = computed(
    () =>
      !!reason.value.trim()
      && reason.value.trim().length <= GAME_DELETION_REASON_MAX_LENGTH,
  );

  /** Закрывает окно, не трогая игру. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Подтверждает скрытие игры с указанной причиной. */
  function confirm(): void {
    if (!isValid.value) {
      return;
    }

    emit('confirm', reason.value.trim());
  }

  // Окно живёт вместе со страницей, поэтому поле чистится при каждом открытии —
  // иначе прошлая причина подставится в следующее удаление.
  watch(isOpen, (opened) => {
    if (opened) {
      reason.value = '';
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="GAME_DELETE_CONFIRM_TITLE"
    :description="GAME_DELETE_CONFIRM_DESCRIPTION"
  >
    <template #body>
      <UFormField
        :label="GAME_DELETE_REASON_LABEL"
        required
      >
        <UTextarea
          v-model="reason"
          :rows="3"
          :maxlength="GAME_DELETION_REASON_MAX_LENGTH"
          :placeholder="GAME_DELETE_REASON_PLACEHOLDER"
          class="w-full"
        />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          :label="CANCEL_LABEL"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          color="error"
          icon="tabler:eye-off"
          :loading="loading"
          :disabled="!isValid"
          :label="GAME_DELETE_LABEL"
          @click.left.exact.prevent="confirm"
        />
      </div>
    </template>
  </UModal>
</template>
