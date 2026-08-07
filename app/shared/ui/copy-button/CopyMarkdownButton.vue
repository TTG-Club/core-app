<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  const { text, size = undefined } = defineProps<{
    text: string;
    disabled?: boolean;
    size?: ButtonProps['size'];
  }>();

  const { copy } = useCopyAndShare();
</script>

<template>
  <UTooltip
    v-if="text"
    text="Скопировать как Markdown"
  >
    <UButton
      icon="tabler:markdown"
      variant="ghost"
      color="neutral"
      :disabled
      :size
      @click.left.exact.prevent="copy(text)"
    />
  </UTooltip>
</template>
