<script setup lang="ts">
  defineProps<{
    title: string;
  }>();
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full flex-col lg:max-w-330 lg:flex-row">
    <div
      class="sticky top-0 left-0 shrink-0 backdrop-blur-lg lg:hidden-scrollbar lg:h-dvh lg:border-r lg:border-(--color-border) lg:backdrop-blur-none"
    >
      <div class="flex w-full flex-col gap-4 p-4 lg:w-60">
        <h2 class="text-2xl text-(--color-text-title)">{{ title }}</h2>

        <slot name="controls" />
      </div>
    </div>

    <div class="min-h-dvh flex-[1_1_auto] px-4 pb-4 lg:pt-4">
      <slot name="default" />
    </div>
  </div>
</template>
