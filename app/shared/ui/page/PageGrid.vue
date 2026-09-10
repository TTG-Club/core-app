<script setup lang="ts">
  /**
   * Промежутки между карточками. Плотный — для списков-строк справочника,
   * просторный — для карточек с обложками, где плотная сетка сливается в
   * сплошное полотно.
   */
  const GAP_CLASSES = {
    tight: 'gap-3',
    wide: 'gap-4',
  } as const;

  const props = defineProps<{
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    gap?: keyof typeof GAP_CLASSES;
  }>();

  const gapClass = computed(() => GAP_CLASSES[props.gap ?? 'tight']);

  const gridClasses = computed(() => {
    const maxCols = Math.min(props.columns ?? 6, 6);

    const breakpoints = [
      'grid-cols-1',
      '@md:grid-cols-2',
      '@xl:grid-cols-3',
      '@4xl:grid-cols-4',
      '@6xl:grid-cols-5',
      '@7xl:grid-cols-6',
    ];

    return breakpoints.slice(0, maxCols);
  });
</script>

<template>
  <div class="@container">
    <div :class="['grid', gapClass, gridClasses]">
      <slot />
    </div>
  </div>
</template>
