<script setup lang="ts">
  /**
   * Фильтры строкой над списком в широком режиме: заголовок, поиск и кнопки
   * фильтров. Место колонки отходит списку и записи.
   */
  defineProps<{
    /** Заголовок секции */
    title: string;
  }>();
</script>

<template>
  <div
    class="flex shrink-0 flex-col gap-3 border-b border-default pr-3 pb-3 pl-4"
  >
    <h2 class="truncate text-xl text-highlighted">{{ title }}</h2>

    <slot name="default" />
  </div>
</template>
