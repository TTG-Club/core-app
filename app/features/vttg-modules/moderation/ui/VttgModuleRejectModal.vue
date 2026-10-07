<script setup lang="ts">
  import type { ModuleSubmission } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import {
    CANCEL_LABEL,
    MODERATION_COMMENT_MAX_LENGTH,
    REJECT_COMMENT_LABEL,
    REJECT_COMMENT_PLACEHOLDER,
    REJECT_ICON,
    REJECT_LABEL,
    REJECT_TITLE,
    TAKE_DOWN_LABEL,
    TAKE_DOWN_TITLE,
    TEXTAREA_ROWS,
  } from '../../model';

  /**
   * Отклонение заявки или снятие модуля из каталога. Причина обязательна:
   * автор увидит её в своей заявке и сможет исправить.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { submission, loading = false } = defineProps<{
    submission: ModuleSubmission | null;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [comment: string];
  }>();

  const comment = ref('');

  const isTakeDown = computed(() => submission?.status === 'APPROVED');

  const title = computed(() =>
    isTakeDown.value ? TAKE_DOWN_TITLE : REJECT_TITLE,
  );

  const submitLabel = computed(() =>
    isTakeDown.value ? TAKE_DOWN_LABEL : REJECT_LABEL,
  );

  const isValid = computed(() => comment.value.trim().length > 0);

  // Причина пишется под конкретную заявку — с прошлого раза её не тянем.
  watch(isOpen, (open) => {
    if (open) {
      comment.value = '';
    }
  });

  /** Закрывает окно без решения. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Отдаёт причину странице — запрос живёт там. */
  function submit(): void {
    if (isValid.value) {
      emit('submit', comment.value.trim());
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title
    :description="submission?.module.name"
  >
    <template #body>
      <UFormField
        :label="REJECT_COMMENT_LABEL"
        required
      >
        <UTextarea
          v-model="comment"
          :maxlength="MODERATION_COMMENT_MAX_LENGTH"
          :placeholder="REJECT_COMMENT_PLACEHOLDER"
          :rows="TEXTAREA_ROWS"
          autoresize
          class="w-full"
        />
      </UFormField>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="CANCEL_LABEL"
        :submit-label
        :submit-icon="REJECT_ICON"
        submit-color="error"
        :loading
        :disabled="!isValid"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
