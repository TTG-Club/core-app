<script setup lang="ts">
  import type { RenderNode } from './types';
  import { RowRender } from './ui';

  const { entries } = defineProps<{
    entries: Array<string | RenderNode>;
  }>();
</script>

<template>
  <ClientOnly>
    <template
      v-for="(entry, index) in entries"
      :key="index"
    >
      <p class="mb-2">
        <RowRender :entry />
      </p>
    </template>
  </ClientOnly>
</template>
