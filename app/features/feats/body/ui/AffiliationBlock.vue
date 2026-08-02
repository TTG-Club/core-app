<script setup lang="ts">
  import type { FeatDetailBackgroundItem } from '~feats/model';

  defineProps<{
    label: string;
    items: Array<FeatDetailBackgroundItem>;
    section: string;
  }>();
</script>

<template>
  <div v-if="items.length">
    <span :class="$style.label">{{ label }}: </span>

    <span>
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
  .label {
    margin-bottom: 2px;
    color: var(--ui-text-highlighted);
  }
</style>
