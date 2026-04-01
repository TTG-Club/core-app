<script setup lang="ts">
  import type { SpellDetailResponse } from '~spells/model';

  import { MarkupContent } from '~markup/content';

  const { description } =
    defineProps<Pick<SpellDetailResponse, 'description' | 'level' | 'upper'>>();
</script>

<template>
  <MarkupContent :content="description" />

  <div v-if="upper">
    <strong v-if="!level">Улучшение заговора. </strong>

    <strong
      v-else
      :style="{ color: 'var(--ui-text-bold)' }"
    >
      Накладывание более высокой ячейкой.
    </strong>

    <MarkupContent :content="upper" />
  </div>
</template>
