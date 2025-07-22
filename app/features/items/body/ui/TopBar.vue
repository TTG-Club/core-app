<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/types';

  const { types } = defineProps<Pick<ItemDetailResponse, 'types'>>();
</script>

<template>
  <AFlex
    :class="$style.topBar"
    :gap="4"
    wrap="wrap"
  >
    <span>{{ types }}</span>
  </AFlex>
</template>

<style module lang="scss">
  .topBar {
    padding: 12px;
    border-radius: 8px;
    font-style: italic;
    background: var(--color-hover);
  }
</style>
