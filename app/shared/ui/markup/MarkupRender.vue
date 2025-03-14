<script setup lang="ts">
  import { markupService } from './renderer';

  const { entries } = defineProps<{
    entries: string | Array<string>;
  }>();

  const renderedEntries = markupService.render(entries);
</script>

<template>
  <ClientOnly>
    <component :is="renderedEntries" />
  </ClientOnly>
</template>
