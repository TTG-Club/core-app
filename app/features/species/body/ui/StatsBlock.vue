<script setup lang="ts">
  import type { SpeciesProperties } from '~/shared/types';

  const { properties } = defineProps<{
    properties: SpeciesProperties;
  }>();
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-lg border border-default bg-muted py-1.5"
  >
    <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
      <span class="min-w-20 text-sm font-medium text-highlighted">Тип:</span>

      <span>{{ properties.type }}</span>
    </div>

    <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
      <span class="min-w-20 text-sm font-medium text-highlighted">Размер:</span>

      <span>{{ properties.size }}</span>
    </div>

    <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
      <span class="min-w-20 text-sm font-medium text-highlighted"
        >Скорость:</span
      >

      <span>{{ properties.speed }}</span>
    </div>
  </div>
</template>
