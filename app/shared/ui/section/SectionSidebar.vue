<script setup lang="ts">
  defineProps<{
    /** Заголовок секции */
    title: string;
  }>();
</script>

<template>
  <div
    class="sticky top-0 left-0 z-1 shrink-0 border-default backdrop-blur-lg md:left-auto lg:hidden-scrollbar lg:h-dvh lg:border-r lg:backdrop-blur-none"
  >
    <div class="flex w-full flex-col gap-4 p-4 md:pt-6 lg:w-60">
      <h2 class="text-2xl text-highlighted">{{ title }}</h2>

      <slot name="default" />
    </div>
  </div>
</template>
