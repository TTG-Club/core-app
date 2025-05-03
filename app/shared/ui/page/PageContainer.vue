<script setup lang="ts">
  defineProps<{
    fixedHeader?: boolean;
  }>();
</script>

<template>
  <div :class="$style.page">
    <div
      v-if="$slots.header"
      :class="[$style.header, { [$style.fixed]: fixedHeader }]"
    >
      <div :class="$style.container">
        <slot name="header" />
      </div>
    </div>

    <div :class="$style.body">
      <div :class="$style.content">
        <slot name="default" />
      </div>

      <div
        v-if="$slots.controls"
        :class="$style.controls"
      >
        <slot name="controls" />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100%;
  }

  .header {
    pointer-events: none;

    z-index: 10;

    width: 100%;
    padding-bottom: 16px;

    background: linear-gradient(
      180deg,
      var(--color-bg-main) 0,
      var(--color-bg-main) 93%,
      transparent 99%,
      transparent 100%
    );

    &.fixed {
      position: sticky;
      top: 0;
    }

    .container {
      pointer-events: auto;

      width: 100%;
      max-width: var(--max-content);
      margin: 0 auto;
      padding: 0 16px;

      @include media-min($lg) {
        padding: 0 24px;
      }
    }
  }

  .body {
    display: flex;
    gap: 16px;

    width: 100%;
    max-width: var(--max-content);
    margin: 0 auto;
    padding: 0 16px 16px 16px;

    @include media-min($lg) {
      padding: 0 24px 24px 24px;
    }

    .content {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: 16px;
    }

    .controls {
      display: flex;
      flex: 1 0 auto;
      flex-direction: column;
      gap: 16px;

      min-width: 288px;
      max-width: 320px;
    }
  }
</style>
