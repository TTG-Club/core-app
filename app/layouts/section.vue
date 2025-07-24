<script setup lang="ts">
  defineProps<{
    title: string;
  }>();
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full flex-col lg:max-w-330 lg:flex-row">
    <div
      class="sticky top-0 left-0 shrink-0 border-default backdrop-blur-lg lg:hidden-scrollbar lg:h-dvh lg:border-r lg:backdrop-blur-none"
    >
      <div class="flex w-full flex-col gap-4 p-4 lg:w-60">
        <h2 class="text-2xl text-(--ui-text-highlighted)">{{ title }}</h2>

        <slot name="controls" />
      </div>
    </div>

    <div class="min-h-dvh flex-auto px-4 pb-8 lg:pt-4">
      <slot name="default" />
    </div>
  </div>
</template>
