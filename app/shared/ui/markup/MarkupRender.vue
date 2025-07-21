<script setup lang="ts">
  import { RowRender } from './ui';

  const { entries } = defineProps<{
    entries: Array<string>;
  }>();
</script>

<template>
  <ClientOnly>
    <template
      v-for="(entry, index) in entries"
      :key="index"
    >
      <p class="mb-1">
        <RowRender :entry />
      </p>
    </template>
  </ClientOnly>
</template>
