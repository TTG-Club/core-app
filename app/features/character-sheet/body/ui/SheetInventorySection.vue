<script setup lang="ts">
  import type { CharacterInventorySection } from '../../model';

  import { SHEET_EMPTY_LABELS } from '../../model';
  import SheetInventoryItemRow from './SheetInventoryItemRow.vue';

  defineProps<{
    section: CharacterInventorySection;
  }>();
</script>

<template>
  <section class="flex flex-col gap-2">
    <h4 class="text-xs font-bold tracking-wider text-muted uppercase">
      {{ section.title }}
    </h4>

    <template v-if="section.items.length">
      <SheetInventoryItemRow
        v-for="inventoryItem in section.items"
        :key="inventoryItem.id"
        :inventory-item="inventoryItem"
      />
    </template>

    <span
      v-else
      class="text-sm text-dimmed italic"
    >
      {{ SHEET_EMPTY_LABELS.inventory }}
    </span>
  </section>
</template>
