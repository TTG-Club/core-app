<script setup lang="ts">
  import { Breakpoint, useBreakpoints } from '~/shared/composables';

  const { fixedHeader } = defineProps<{
    fixedHeader?: boolean;
  }>();

  const header = useTemplateRef<HTMLDivElement>('header');
  const { height: headerHeight } = useElementBounding(header);
  const { height: windowHeight } = useWindowSize();
  const { y: yScroll } = useWindowScroll();
  const { greaterOrEqual } = useBreakpoints();
  const isControlInBody = greaterOrEqual(Breakpoint.LG);

  const headerHeightDelta = computed(() => {
    if (fixedHeader) {
      return headerHeight.value;
    }

    const delta = headerHeight.value - yScroll.value;

    return delta >= 0 ? delta : 0;
  });

  const maxControlsHeight = computed(
    () => windowHeight.value - headerHeight.value,
  );
</script>

<template>
  <div :class="$style.page">
    <div
      v-if="$slots.header || (!isControlInBody && $slots.controls)"
      ref="header"
      :class="[$style.header, { [$style.fixed]: fixedHeader }]"
    >
      <div
        :class="$style.container"
        data-allow-mismatch
      >
        <slot name="header" />

        <div
          v-if="!isControlInBody"
          :class="$style.controls"
        >
          <slot name="controls" />
        </div>
      </div>
    </div>

    <div
      :class="$style.body"
      data-allow-mismatch
    >
      <div
        v-if="isControlInBody"
        :class="$style.controls"
        :style="{
          top: `${headerHeightDelta}px`,
          maxHeight: `${maxControlsHeight}px`,
        }"
      >
        <slot name="controls" />
      </div>

      <div :class="$style.content">
        <slot name="default" />
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

      display: flex;
      flex-direction: column;
      gap: 8px;

      width: 100%;
      max-width: var(--max-content);
      margin: 0 auto;
      padding: 0 16px 16px;

      @include media-min($lg) {
        gap: 12px;
        padding: 0 24px 24px;
      }
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }
  }

  .body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 16px;

    width: 100%;
    max-width: var(--max-content);
    margin: 0 auto;
    padding: 0 16px;

    @include media-min($lg) {
      flex-direction: row;
      padding: 0 24px;
    }

    .controls {
      scrollbar-width: none;

      position: sticky;

      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;

      max-width: 240px;
      height: 100%;
      padding: 16px 16px 16px 0;
      border-right: 1px solid var(--color-border);

      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .content {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: 16px;

      padding: 16px 0;
    }
  }
</style>
