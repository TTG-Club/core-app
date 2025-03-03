<script setup lang="ts">
  import type { SpellDetail } from '~/shared/types';

  defineProps<
    Pick<SpellDetail, 'level' | 'school' | 'additionalType' | 'ritual'>
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

    font-style: italic;
    text-transform: lowercase;

    background: var(--color-hover);
    border-radius: 8px;
  }
</style>
