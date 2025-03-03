<script setup lang="ts">
  import type { SpellDetailAffiliationItem } from '~/shared/types';

  defineProps<{
    label: string;
    items: Array<SpellDetailAffiliationItem>;
  }>();
</script>

<template>
  <div
    v-if="items.length"
    :class="$style.block"
  >
    <p :class="$style.label">{{ label }}:</p>

    <span :class="$style.item">
      <span
        v-for="(item, key) in items"
        :key="key"
      >
        <NuxtLink :to="{ name: 'spells-url', params: { url: item.url } }">
          {{ item.name }}
        </NuxtLink>

        <span v-if="key !== items.length - 1">, </span>
      </span>
    </span>
  </div>
</template>

<style module lang="scss">
  .block {
  }

  .label {
    margin-bottom: 2px;
    color: var(--color-text-title);
  }

  .item {
  }
</style>
