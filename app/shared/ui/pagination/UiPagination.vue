<script setup lang="ts">
  import type { PaginationProps } from '@nuxt/ui';

  import {
    PAGINATION_HIDDEN_EDGE_CONTROLS,
    PAGINATION_SIBLING_COUNT,
  } from './constants';
  import { resolvePaginationSettings } from './utils';

  /**
   * Пагинация, подстраивающаяся под ширину контейнера.
   *
   * Меряет не окно, а сам контейнер: одна и та же пагинация может стоять и во
   * всю ширину страницы, и в узкой колонке списка рядом с открытой сущностью,
   * и в дровере. По ширине подбирается самая полная раскладка, которая влезает:
   * сначала уходят кнопки «в начало»/«в конец», затем соседние номера, в самом
   * конце — края с многоточиями.
   */
  const {
    total,
    itemsPerPage,
    siblingCount = PAGINATION_SIBLING_COUNT,
  } = defineProps<{
    /** Общее количество элементов во всём списке, а не на странице. */
    total: number;
    /** Размер страницы — тот же, с которым ходим за данными. */
    itemsPerPage: number;
    /** Сколько соседних номеров показывать, когда места хватает. */
    siblingCount?: number;
  }>();

  const page = defineModel<number>('page', { required: true });

  const container = useTemplateRef<HTMLElement>('container');

  const { width } = useElementSize(container);

  const pageCount = computed(() => Math.ceil(total / itemsPerPage));

  const settings = computed(() =>
    resolvePaginationSettings(width.value, pageCount.value, siblingCount),
  );

  const paginationUi = computed<PaginationProps['ui']>(() =>
    settings.value.showEdgeControls
      ? undefined
      : PAGINATION_HIDDEN_EDGE_CONTROLS,
  );
</script>

<template>
  <div
    ref="container"
    class="w-full overflow-x-auto"
  >
    <UPagination
      v-model:page="page"
      class="mx-auto w-fit"
      :total="total"
      :items-per-page="itemsPerPage"
      :sibling-count="settings.siblingCount"
      :show-edges="settings.showEdges"
      :ui="paginationUi"
    />
  </div>
</template>
