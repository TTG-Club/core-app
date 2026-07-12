<script setup lang="ts">
  const open = defineModel<boolean>('open', { default: false });

  const {
    title,
    description = undefined,
    confirmLabel = 'Подтвердить',
    confirmColor = 'primary',
    confirmIcon = undefined,
    loading = false,
  } = defineProps<{
    title: string;
    description?: string;
    confirmLabel?: string;
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
          Отмена
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
