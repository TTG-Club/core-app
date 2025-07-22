<script setup lang="ts">
  import type { SpellDetailResponse } from '~/shared/types';

  defineProps<
    Pick<SpellDetailResponse, 'level' | 'school' | 'additionalType' | 'ritual'>
  >();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-lg bg-elevated p-3 italic">
    <span v-if="!level">Заговор,</span>

    <span v-else> {{ level }}-й уровень,</span>

    <span>{{ school }}</span>

    <span v-if="additionalType">[{{ additionalType }}]</span>

    <span v-if="ritual">(ритуал)</span>
  </div>
</template>
