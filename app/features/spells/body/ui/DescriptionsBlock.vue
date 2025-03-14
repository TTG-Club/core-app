<script setup lang="ts">
  import type { SpellDetailResponse } from '~/shared/types';
  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<SpellDetailResponse, 'description' | 'level' | 'upper'>>();

  const descriptionEntries = computed(() => description.split('\n\n'));
</script>

<template>
  <MarkupRender :entries="descriptionEntries" />

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
