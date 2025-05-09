<script setup lang="ts">
  const { columns } = defineProps<{
    columns: number;
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
    grid-gap: 12px;
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
          grid-template-columns: repeat(2, calc(50% - 6px));
        }
      }

      &-3,
      &-4,
      &-5 {
        @container (width >= 812px) {
          grid-template-columns: repeat(3, calc((100% - 12px * 2) / 3));
        }
      }

      &-4,
      &-5 {
        @container (width >= 1024px) {
          grid-template-columns: repeat(4, calc((100% - 12px * 3) / 4));
        }
      }

      &-5 {
        @container (width >= 1272px) {
          grid-template-columns: repeat(5, calc((100% - 12px * 4) / 5));
        }
      }
    }
  }
</style>
