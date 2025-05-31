<script setup lang="ts">
  import type { CreatureDetailResponse } from '~/features/bestiary/types';

  defineProps<Pick<CreatureDetailResponse, 'header'>>();
</script>

<template>
  <AFlex
    :class="$style.topBar"
    :gap="4"
    wrap="wrap"
  >
    <span>{{ header }}</span>
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
