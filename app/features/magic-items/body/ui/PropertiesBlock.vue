<script setup lang="ts">
  import type { MagicItemDetailResponse } from '../../model';

  import { getMagicItemPropertyRows } from '../../model';

  const { magicItem } = defineProps<{
    magicItem: MagicItemDetailResponse;
  }>();

  const rows = computed(() => getMagicItemPropertyRows(magicItem));
</script>

<template>
  <div
    v-if="rows.length"
    :class="$style.properties"
  >
    <div
      v-for="row in rows"
      :key="row.key"
      :class="$style.item"
    >
      <span :class="$style.name">{{ row.label }}:</span>

      <span>{{ row.value }}</span>
    </div>
  </div>
</template>

<style module lang="scss">
  .properties {
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;

    width: 100%;
    min-width: 272px;
    padding: 8px 0;
    border: 1px solid var(--ui-border);
    border-radius: 8px;

    background-color: var(--ui-bg-muted);

    .item {
      display: flex;
      flex: 1 0 100%;
      flex-direction: column;

      min-width: 100%;
      padding: 6px 16px;

      .name {
        font-weight: 600;
        color: var(--ui-text-bold);
      }
    }
  }
</style>
