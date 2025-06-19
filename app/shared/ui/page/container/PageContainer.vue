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
  <div class="page-container">
    <div
      v-if="$slots.header || (!isControlInBody && $slots.controls)"
      ref="header"
      class="header"
      :class="{ fixed: fixedHeader }"
    >
      <div class="container">
        <slot name="header" />

        <div
          v-if="!isControlInBody"
          class="flex w-full flex-col gap-[16px]"
        >
          <slot name="controls" />
        </div>
      </div>
    </div>

    <div class="body">
      <div
        v-if="isControlInBody && $slots.controls"
        class="controls"
        :style="{
          top: `${headerHeightDelta}px`,
          maxHeight: `${maxControlsHeight}px`,
        }"
      >
        <slot name="controls" />
      </div>

      <div class="content">
        <slot name="default" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference '~tw';

  .page-container {
    @apply flex min-h-full w-full flex-col;

    .header {
      @apply pointer-events-none z-10 w-full bg-(--color-bg-main);

      &.fixed {
        @apply sticky top-0;
      }

      .container {
        @apply pointer-events-auto flex w-full max-w-(--max-content);
        @apply mx-auto px-4 py-4;
        @apply flex-col gap-2 lg:gap-3;
      }

      .controls {
        @apply flex w-full flex-col gap-4;
      }
    }

    .body {
      @apply w-full max-w-(--max-content);
      @apply flex flex-[1_1_auto] flex-col lg:flex-row;
      @apply mx-auto gap-4 px-4;

      .controls {
        @apply sticky hidden-scrollbar flex h-full w-60 shrink-0 flex-col gap-4 border-r border-(--color-border) pr-4 pb-4;
      }

      .content {
        @apply flex flex-[1_1_auto] flex-col gap-4 pb-4;
      }
    }
  }
</style>
