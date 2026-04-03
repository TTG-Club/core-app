<script setup lang="ts">
  interface EditorFormControlsProps {
    previewLabel?: string;
    submitLabel?: string;
    isSubmitDisabled?: boolean;
    isPreviewDisabled?: boolean;
  }

  interface PreviewSlotProps {
    opened: boolean;
    changeVisibility: (value: boolean) => void;
  }

  const props = withDefaults(defineProps<EditorFormControlsProps>(), {
    previewLabel: 'Предварительный просмотр',
    submitLabel: 'Сохранить',
    isSubmitDisabled: false,
    isPreviewDisabled: false,
  });

  const isPreviewOpened = ref(false);

  function setPreviewVisibility(value: boolean): void {
    isPreviewOpened.value = value;
  }

  function togglePreviewVisibility(): void {
    isPreviewOpened.value = !isPreviewOpened.value;
  }

  const previewSlotProps = computed<PreviewSlotProps>(() => ({
    opened: isPreviewOpened.value,
    changeVisibility: setPreviewVisibility,
  }));
</script>

<template>
  <div class="sticky bottom-0 z-20 col-span-full">
    <div
      class="flex items-center justify-end gap-3 border-t border-default bg-default/95 px-4 py-3 backdrop-blur"
    >
      <UButton
        v-if="$slots.preview"
        variant="soft"
        color="neutral"
        :disabled="props.isPreviewDisabled"
        @click.left.exact.prevent="togglePreviewVisibility"
      >
        {{ props.previewLabel }}
      </UButton>

      <UButton
        type="submit"
        :disabled="props.isSubmitDisabled"
      >
        {{ props.submitLabel }}
      </UButton>
    </div>

    <slot
      name="preview"
      v-bind="previewSlotProps"
    />
  </div>
</template>
