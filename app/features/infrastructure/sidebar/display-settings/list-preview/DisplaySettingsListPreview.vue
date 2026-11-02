<script setup lang="ts">
  import type { ListView } from '~infrastructure/list-presentation/composable';

  import { LIST_PREVIEW_CARD_COUNT, LIST_PREVIEW_ROW_COUNT } from './constants';

  /**
   * Миниатюра вида списка: сетка карточек или строки во всю ширину.
   */
  const { view } = defineProps<{
    /** Вид списка */
    view: ListView;
  }>();

  const isGrid = computed(() => view === 'grid');
</script>

<template>
  <span
    v-if="isGrid"
    class="grid h-10 grid-cols-2 gap-0.5"
    aria-hidden="true"
  >
    <span
      v-for="card in LIST_PREVIEW_CARD_COUNT"
      :key="card"
      class="rounded-xs border border-accented"
    />
  </span>

  <span
    v-else
    class="flex h-10 flex-col justify-center gap-1"
    aria-hidden="true"
  >
    <span
      v-for="row in LIST_PREVIEW_ROW_COUNT"
      :key="row"
      class="h-1.5 rounded-xs bg-inverted/30"
    />
  </span>
</template>
