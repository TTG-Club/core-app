<script setup lang="ts">
  const { columns } = defineProps<{
    columns:
      | {
          xl?: number;
          md: number;
          xs: number;
        }
      | number;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="[$style.grid, $style[`cols-${columns}`]]">
      <slot name="default" />
    </div>
  </div>
</template>

<style module lang="scss">
  .container {
    container-type: inline-size;
    width: 100%;
  }

  .grid {
    display: grid;
    grid-gap: 8px;
    width: 100%;

    &.cols {
      &-1,
      &-2,
      &-3,
      &-4,
      &-5 {
        grid-template-columns: repeat(1, 100%);
      }

      &-2,
      &-3,
      &-4,
      &-5 {
        @container (width >= 528px) {
          grid-template-columns: repeat(2, calc(50% - 4px));
        }
      }

      &-3,
      &-4,
      &-5 {
        @container (width >= 744px) {
          grid-template-columns: repeat(3, calc((100% - 4px * 2) / 3));
        }
      }

      &-4,
      &-5 {
        @container (width >= 920px) {
          grid-template-columns: repeat(4, calc((100% - 4px * 3) / 4));
        }
      }

      &-5 {
        @container (width >= 1200px) {
          grid-template-columns: repeat(5, calc((100% - 4px * 4) / 5));
        }
      }
      //
      //@for $i from 2 through 5 {
      //  $colSize: calc((100% - (8px * ($i - 1))) / $i);
      //
      //  &-#{$i} {
      //    grid-template-columns: repeat($i, $colSize);
      //  }
      //}
    }
  }
</style>
