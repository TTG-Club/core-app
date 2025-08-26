<script setup lang="ts">
  const { typeValue, size, speed } = defineProps<{
    typeValue: string | number | undefined;
    size: string | number | undefined;
    speed: string | number | undefined;
  }>();
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-lg border border-default bg-muted py-1.5"
  >
    <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
      <span class="min-w-20 text-sm font-medium text-highlighted">Тип:</span>

      <span>{{ typeValue }}</span>
    </div>

    <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
      <span class="min-w-20 text-sm font-medium text-highlighted">Размер:</span>

      <span>{{ size }}</span>
    </div>

    <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
      <span class="min-w-20 text-sm font-medium text-highlighted"
        >Скорость:</span
      >

      <span>{{ speed }}</span>
    </div>
  </div>
</template>
