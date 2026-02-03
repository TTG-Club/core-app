<script setup lang="ts">
  // No props needed for now as it's static
</script>

<template>
  <div
    class="absolute inset-0 z-20 flex items-center justify-center bg-primary/10"
  >
    <div class="flex flex-col items-center gap-2 text-primary">
      <UIcon
        name="i-fluent-arrow-download-20-regular"
        class="size-12"
      />

      <span class="text-lg font-medium">Отпустите для загрузки</span>
    </div>
  </div>
</template>
