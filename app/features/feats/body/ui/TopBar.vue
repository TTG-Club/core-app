<script setup lang="ts">
  import type { FeatDetailResponse } from '~/shared/types';

  defineProps<Pick<FeatDetailResponse, 'category'>>();
</script>

<template>
  <AFlex
    :class="$style.topBar"
    :gap="4"
    wrap="wrap"
  >
    <span>{{ category }}</span>
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
