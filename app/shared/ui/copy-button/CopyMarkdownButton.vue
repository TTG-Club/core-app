<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { COPY_BUTTON_LABELS } from './constants';

  const { text, size = undefined } = defineProps<{
    /**
     * Геттер Markdown-текста: сборка сущности разбирает всю её разметку,
     * поэтому откладывается до клика, а не идёт на каждый рендер.
     */
    text: () => string;
    size?: ButtonProps['size'];
  }>();

  const { copy } = useCopyAndShare();

  /**
   * Геттер уходит в `copy` как есть — она сама его вызовет через `toValue`.
   *
   * Промис возвращается наружу, а не теряется: `copy` бросает после того,
   * как показала тост, и Vue гасит отказ обработчика сам. Потерянный промис
   * всплыл бы необработанным отказом.
   */
  async function copyMarkdown(): Promise<void> {
    await copy(text);
  }
</script>

<template>
  <UTooltip :text="COPY_BUTTON_LABELS.markdown">
    <UButton
      icon="tabler:markdown"
      variant="ghost"
      color="neutral"
      :size
      @click.left.exact.prevent="copyMarkdown"
    />
  </UTooltip>
</template>
