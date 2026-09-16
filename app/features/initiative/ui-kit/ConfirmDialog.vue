<script setup lang="ts">
  const open = defineModel<boolean>('open', { default: false });

  const {
    title,
    description = undefined,
    confirmLabel = 'Подтвердить',
    cancelLabel = 'Отмена',
    confirmColor = 'primary',
    confirmIcon = undefined,
    loading = false,
  } = defineProps<{
    title: string;
    description?: string;
    confirmLabel?: string;

    /**
     * Подпись отказа. Своя нужна там, где рядом стоит такой же диалог с другой:
     * в форме класса удаление умения предлагает «Оставить», и «Отмена» у
     * соседнего вопроса читалась бы как другое действие.
     */
    cancelLabel?: string;
    confirmColor?: 'primary' | 'error' | 'warning' | 'success' | 'neutral';
    confirmIcon?: string;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    confirm: [];
  }>();

  function cancel(): void {
    open.value = false;
  }

  function confirm(): void {
    emit('confirm');
  }
</script>

<template>
  <UModal
    v-model:open="open"
    :title
    :description
  >
    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          @click.left.exact.prevent="cancel"
        >
          {{ cancelLabel }}
        </UButton>

        <UButton
          :color="confirmColor"
          :icon="confirmIcon"
          :loading
          @click.left.exact.prevent="confirm"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
