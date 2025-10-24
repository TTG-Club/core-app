<script setup lang="ts">
  const props = defineProps<{
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
  }>();

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
    <div :class="['grid gap-3', gridClasses]">
      <slot />
    </div>
  </div>
</template>
