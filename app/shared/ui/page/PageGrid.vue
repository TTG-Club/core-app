<script setup lang="ts">
  import { Breakpoint, useBreakpoints } from '~/shared/composables';

  const { columns } = defineProps<{
    columns:
      | {
          xl?: number;
          md: number;
          xs: number;
        }
      | number;
  }>();

  const { greaterOrEqual } = useBreakpoints();

  const isXlOrGreater = greaterOrEqual(Breakpoint.XL);
  const isMdOrGreater = greaterOrEqual(Breakpoint.MD);

  const calcColumns = computed(() => {
    if (typeof columns === 'number') {
      return columns > 0 ? columns : 1;
    }

    if (columns.xl && columns.xl > 0 && isXlOrGreater.value) {
      return columns.xl;
    }

    if (columns.md > 0 && isMdOrGreater.value) {
      return columns.md;
    }

    return columns.xs > 0 ? columns.xs : 1;
  });
</script>

<template>
  <div :class="$style.grid">
    <slot name="default" />
  </div>
</template>

<style module lang="scss">
  .grid {
    display: grid;
    grid-gap: 8px;
    grid-template-columns: repeat(
      v-bind(calcColumns),
      calc((100% - (8px * (v-bind(calcColumns) - 1))) / v-bind(calcColumns))
    );
    width: 100%;
  }
</style>
