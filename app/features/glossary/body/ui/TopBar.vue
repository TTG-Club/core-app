<script setup lang="ts">
  import type { GlossaryDetailResponse } from '~/shared/types';

  defineProps<Pick<GlossaryDetailResponse, 'tags'>>();
</script>

<template>
  <AFlex
    :class="$style.topBar"
    :gap="4"
    wrap="wrap"
  >
    <span>{{ tags }}</span>
  </AFlex>
</template>

<style module lang="scss">
  .topBar {
    padding: 12px;
    border-radius: 8px;

    font-style: italic;
    text-transform: lowercase;

    background: var(--color-hover);
  }
</style>
