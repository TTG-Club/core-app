<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/types';

  defineProps<Pick<ItemDetailResponse, 'subtitle'>>();
</script>

<template>
  <AFlex
    :class="$style.topBar"
    :gap="4"
    wrap="wrap"
  >
    <span>{{ subtitle }}</span>
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
