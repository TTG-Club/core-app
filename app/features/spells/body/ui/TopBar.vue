<script setup lang="ts">
  import type { SpellDetailResponse } from '~/shared/types';

  defineProps<
    Pick<SpellDetailResponse, 'level' | 'school' | 'additionalType' | 'ritual'>
  >();
</script>

<template>
  <AFlex
    :class="$style.topBar"
    :gap="4"
    wrap="wrap"
  >
    <span v-if="!level">Заговор,</span>

    <span v-else> {{ level }}-й уровень,</span>

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
    background: var(--color-hover);
  }
</style>
