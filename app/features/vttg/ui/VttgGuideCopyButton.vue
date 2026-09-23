<script setup lang="ts">
  import { VTTG_GUIDE_COPY_ICON, VTTG_GUIDE_COPY_LABEL } from '../model';

  const { text } = defineProps<{
    /** Текст, который уходит в буфер обмена. */
    text: string;
  }>();

  const { copy } = useCopyAndShare();

  /**
   * Копирует текст целиком. Промис возвращается наружу: `copy` сама показывает
   * тост и бросает при ошибке, а отказ обработчика Vue гасит сам.
   */
  async function copyText(): Promise<void> {
    await copy(text);
  }
</script>

<template>
  <UTooltip :text="VTTG_GUIDE_COPY_LABEL">
    <UButton
      :icon="VTTG_GUIDE_COPY_ICON"
      :aria-label="VTTG_GUIDE_COPY_LABEL"
      color="neutral"
      variant="ghost"
      size="xs"
      @click.left.exact.prevent="copyText"
    />
  </UTooltip>
</template>
