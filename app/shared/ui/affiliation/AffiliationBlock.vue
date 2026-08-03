<script setup lang="ts">
  import type { AffiliationItem, AffiliationSection } from './types';

  defineProps<{
    label: string;
    items: Array<AffiliationItem>;
    section: AffiliationSection;
  }>();
</script>

<template>
  <div v-if="items.length">
    <span class="text-highlighted">{{ label }}: </span>

    <span>
      <span
        v-for="(item, index) in items"
        :key="item.url"
      >
        <ULink
          :to="{
            name: `${section}-url`,
            params: { url: item.url },
          }"
        >
          {{ item.name }}
        </ULink>

        <span v-if="index !== items.length - 1">, </span>
      </span>
    </span>
  </div>
</template>
