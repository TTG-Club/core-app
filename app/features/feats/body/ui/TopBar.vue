<script setup lang="ts">
  import type { FeatDetailResponse } from '~/shared/types';

  defineProps<
    Pick<FeatDetailResponse, 'category' | 'prerequsit'>
  >();
</script>

<template>
  <AFlex
    :class="$style.topBar"
    :gap="4"
    wrap="wrap"
  >
    <span>{{ school }}</span>

    <span v-if="additionalType">[{{ additionalType }}]</span>

    <span v-if="ritual">(ритуал)</span>
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
