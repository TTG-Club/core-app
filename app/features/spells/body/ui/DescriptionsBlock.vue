<script setup lang="ts">
  import type { SpellDetailResponse } from '~/shared/types';

  defineProps<Pick<SpellDetailResponse, 'description' | 'level' | 'upper'>>();
</script>

<template>
  <div :style="{ whiteSpace: 'pre-wrap' }">
    {{ description }}
  </div>

  <div v-if="upper">
    <strong v-if="!level">Улучшение заговора. </strong>

    <strong
      v-else
      :style="{ color: 'var(--color-text-bold)' }"
    >
      Накладывание более высокой ячейкой.
    </strong>

    <span :style="{ whiteSpace: 'pre-wrap' }">{{ upper }}</span>
  </div>
</template>
