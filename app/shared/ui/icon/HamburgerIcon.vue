<script setup lang="ts">
  defineProps<{
    isActive?: boolean;
  }>();
</script>

<template>
  <div :class="[$style.hamburger, { [$style.isActive]: isActive }]">
    <span :class="$style.line" />

    <span :class="$style.line" />

    <span :class="$style.line" />
  </div>
</template>

<style lang="scss" module>
  .hamburger {
    position: relative;
    display: block;
    height: auto;
    padding: 9px 9px;

    .line {
      display: block;

      width: 20px;
      height: 2px;
      margin: 4px auto;

      background-color: var(--color-background-thumb);
      border-radius: 2px;

      transition: all 0.3s ease-in-out;
    }

    &.isActive {
      .line {
        &:nth-child(2) {
          opacity: 0;
        }
        &:nth-child(1) {
          transform: translateY(6px) rotate(45deg) translate3d(0, 0, 0);
        }
        &:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg) translate3d(0, 0, 0);
        }
      }
    }

    &:hover {
      cursor: pointer;

      .line {
        background-color: var(--color-text-b);

        &:nth-child(1) {
          transform: translateX(-6px) translate3d(0, 0, 0);
          width: 14px;
        }
      }

      &.isActive {
        .line {
          &:nth-child(1) {
            transform: translateY(6px) rotate(45deg) translate3d(0, 0, 0);
            width: 20px;
          }
        }
      }
    }
  }
</style>
