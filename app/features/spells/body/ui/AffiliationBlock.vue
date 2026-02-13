<script setup lang="ts">
  import type { SpellDetailAffiliationItem } from '~spells/model';

  defineProps<{
    label: string;
    items: Array<SpellDetailAffiliationItem>;
    section: string;
  }>();
</script>

<template>
  <div
    v-if="items.length"
    :class="$style.block"
  >
    <span :class="$style.label">{{ label }}: </span>

    <span :class="$style.item">
      <span
        v-for="(item, key) in items"
        :key="key"
      >
        <ULink
          :to="{
            name: `${section}-url`,
            params: { url: item.url },
          }"
        >
          {{ item.name }}
        </ULink>

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
    color: var(--ui-text-highlighted);
  }

  .item {
  }
</style>
