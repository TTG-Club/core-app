<script setup lang="ts">
  import { RowRender } from './ui';

  const { entries } = defineProps<{
    entries: Array<string>;
  }>();
</script>

<template>
  <ClientOnly>
    <p
      v-for="(entry, index) in entries"
      :key="index"
      class="mb-1"
    >
      <RowRender :entry />
    </p>
  </ClientOnly>
</template>
