<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  const { text, size = undefined } = defineProps<{
    /**
     * Геттер Markdown-текста: сборка сущности разбирает всю её разметку,
     * поэтому откладывается до клика, а не идёт на каждый рендер.
     */
    text: () => string;
    size?: ButtonProps['size'];
  }>();

  const { copy } = useCopyAndShare();

  function copyMarkdown() {
    copy(text());
  }
</script>

<template>
  <UTooltip text="Скопировать как Markdown">
    <UButton
      icon="tabler:markdown"
      variant="ghost"
      color="neutral"
      :size
      @click.left.exact.prevent="copyMarkdown"
    />
  </UTooltip>
</template>
