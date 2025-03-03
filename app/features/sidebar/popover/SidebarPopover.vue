<script setup lang="ts">
  import { onKeyDown } from '@vueuse/core';
  import { useSidebarPopover } from '~/shared/composables';

  const { popoverKey } = defineProps<{
    popoverKey: string;
  }>();

  const { close, open, toggle, isOpened } = useSidebarPopover(popoverKey);

  onKeyDown('Escape', (e: KeyboardEvent) => {
    if (!isOpened.value) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    close();
  });
</script>

<template>
  <div :class="$style.navPopover">
    <div :class="[$style.trigger, { [$style.isActive]: isOpened }]">
      <slot
        :open="() => open()"
        :is-opened="isOpened"
        :close="() => close()"
        :toggle="() => toggle()"
        name="trigger"
      />
    </div>

    <Transition name="fade">
      <div
        v-if="isOpened"
        :class="$style.background"
        @click.left.exact.self.prevent.stop="close()"
      />
    </Transition>

    <Transition name="nav-popover-animation">
      <AFlex
        v-if="isOpened"
        :class="$style.body"
        vertical
      >
        <slot
          :close="() => close()"
          name="default"
        />
      </AFlex>
    </Transition>
  </div>
</template>

<style lang="scss" module>
  @use 'assets/styles/variables/breakpoints' as *;
  @use 'assets/styles/variables/mixins' as *;

  .navPopover {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
  }

  .trigger {
    position: relative;
    width: 100%;
    height: 100%;
    font-size: 24px;

    &.isActive {
      z-index: 200;
    }
  }

  .background {
    cursor: pointer;

    position: fixed;
    z-index: 180;
    top: 0;
    left: 0;
    transform: translate3d(0, 0, 0);

    width: 100vw;
    height: var(--max-vh);

    background-color: rgba(19, 26, 32, 0.3);
  }

  .body {
    pointer-events: auto;
    cursor: auto;

    position: absolute;
    z-index: 190;
    top: inherit;
    right: 0;
    bottom: calc(64px + var(--safe-area-inset-bottom));
    left: 8px;
    transform-origin: bottom left;

    overflow: auto;
    display: inline-block;

    width: calc(100vw - 16px);
    max-width: calc(100vw - 16px);
    max-height: calc(var(--max-vh) - 72px - var(--safe-area-inset-bottom));
    border-radius: 12px;

    background-image: var(--color-bg-gradient);
    backdrop-filter: blur(16px);
    box-shadow: 0 22px 122px rgb(0 0 0 / 78%);

    @include media-min($md) {
      top: 16px;
      bottom: inherit;
      left: 72px;
      transform-origin: top left;

      width: calc(100vw - 80px);
      max-width: 1100px;
    }
  }
</style>
