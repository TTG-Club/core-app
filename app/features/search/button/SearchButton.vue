<script setup lang="ts">
  import { useGlobalSearch } from '~search/composable';

  const { open } = useGlobalSearch();
</script>

<template>
  <UButton
    variant="ghost"
    icon="i-ttg-search"
    size="xl"
    color="neutral"
    @click.left.exact.prevent="open"
  />
</template>
