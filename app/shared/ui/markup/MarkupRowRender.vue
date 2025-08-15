<script setup lang="ts">
  import { RowRender } from './ui';

  defineProps<{
    entry: string;
  }>();
</script>

<template>
  <ClientOnly>
    <RowRender :entry />
  </ClientOnly>
</template>
