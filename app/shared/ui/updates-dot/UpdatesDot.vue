<script setup lang="ts">
  /**
   * Точка-индикатор «здесь есть непросмотренное».
   *
   * Намеренно без числа: количество непрочитанного пользователю ничего не
   * решает, важен сам факт — поэтому метка одинаково читается и рядом с
   * подписью пункта меню, и поверх иконки.
   */
  defineProps<{
    /** Подсказка при наведении */
    title?: string;
  }>();
</script>

<template>
  <span
    class="relative flex size-2 shrink-0"
    :title="title"
    aria-hidden="true"
  >
    <span
      class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"
    />

    <span class="relative inline-flex size-2 rounded-full bg-primary" />
  </span>
</template>
