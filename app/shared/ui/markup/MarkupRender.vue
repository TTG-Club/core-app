<script setup lang="ts">
  import { RowRender } from './ui';
  import type { EntryList } from './types';

  const { entries } = defineProps<{
    entries: EntryList;
  }>();
</script>

<template>
  <ClientOnly>
    <p
      v-for="(entry, index) in entries"
      :key="index"
      class="mb-2"
    >
      <RowRender :entry />
    </p>
  </ClientOnly>
</template>
