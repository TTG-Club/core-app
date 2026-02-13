<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { SpellDetailResponse } from '~spells/model';

  const { description } =
    defineProps<Pick<SpellDetailResponse, 'description' | 'level' | 'upper'>>();
</script>

<template>
  <MarkupRender :render-node="description" />

  <div v-if="upper">
    <strong v-if="!level">Улучшение заговора. </strong>

    <strong
      v-else
      :style="{ color: 'var(--ui-text-bold)' }"
    >
      Накладывание более высокой ячейкой.
    </strong>

    <MarkupRender :render-node="upper" />
  </div>
</template>
