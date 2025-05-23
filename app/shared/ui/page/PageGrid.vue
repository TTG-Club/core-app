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
  @mixin create-grid() {
    @for $cols from 1 through 5 {
      &-#{$cols} {
        grid-template-columns: repeat(1, 100%);

        @if $cols > 1 {
          @for $col from 2 through $cols {
            $cell: 244px;
            $gap: 12px;

            $container: $col * $cell + $gap * ($col - 1);

            @container (width >= #{$container}) {
              grid-template-columns: repeat(
                $col,
                calc((100% - $gap * ($col - 1)) / $col)
              );
            }
          }
        }
      }
    }
  }

  .container {
    container-type: inline-size;
    width: 100%;
  }

  .grid {
    display: grid;
    grid-gap: 12px;
    width: 100%;

    &.cols {
      @include create-grid;
    }
  }
</style>
