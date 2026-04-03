<script setup lang="ts">
  interface Props {
    submitLabel?: string;
    previewLabel?: string;
    submitDisabled?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    submitLabel: 'Сохранить',
    previewLabel: 'Предпросмотр',
    submitDisabled: false,
  });
</script>

<template>
  <div class="sticky bottom-0 z-20 col-span-full">
    <div
      class="flex justify-end gap-3 border-t border-default bg-default/95 px-4 py-3 backdrop-blur"
    >
      <slot name="left" />

      <slot name="actions">
        <UButton
          variant="soft"
          color="neutral"
        >
          {{ previewLabel }}
        </UButton>

        <UButton
          type="submit"
          :disabled="submitDisabled"
        >
          {{ submitLabel }}
        </UButton>
      </slot>
    </div>
  </div>
</template>
