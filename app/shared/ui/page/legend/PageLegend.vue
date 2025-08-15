<script setup lang="ts">
  import type { LegendItems } from './types';

  defineProps<{
    items: LegendItems;
  }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <span>Легенда:</span>

    <div class="flex items-center gap-2">
      <UTooltip
        v-for="item in items"
        :key="item.label"
        :text="item.title"
        disable-hoverable-content
      >
        <UBadge
          color="neutral"
          variant="subtle"
        >
          {{ item.label }}
        </UBadge>
      </UTooltip>
    </div>
  </div>
</template>
