<script setup lang="ts">
  import { PageControls } from './ui';

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

      <ClientOnly>
        <PageControls v-if="$slots.controls">
          <slot name="controls" />
        </PageControls>
      </ClientOnly>
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
      padding: 0 16px 16px;

      @include media-min($lg) {
        padding: 0 24px 24px;
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
  }
</style>
