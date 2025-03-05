<script setup lang="ts">
  import type { SpellDetailResponse } from '~/shared/types';

  defineProps<Pick<SpellDetailResponse, 'description' | 'level' | 'upper'>>();
</script>

<template>
  <div :style="{ whiteSpace: 'pre-wrap' }">
    {{ description }}
  </div>

  <div
    v-if="upper"
    :style="{ whiteSpace: 'pre-wrap' }"
  >
    <strong v-if="!level">Улучшение заговора. </strong>

    <strong v-else>Накладывание более высокой ячейкой. </strong>

    <span>{{ upper }}</span>
  </div>
</template>
