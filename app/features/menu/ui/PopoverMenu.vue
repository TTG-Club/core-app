<script setup lang="ts">
  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const isShow = defineModel<boolean>({ default: false });

  function onClose() {
    isShow.value = false;

    emit('close');
  }
</script>

<template>
  <div :class="$style.navPopover">
    <div :class="[$style.trigger, { [$style.isActive]: isShow }]">
      <slot
        :is-show="isShow"
        name="trigger"
      />
    </div>

    <Transition name="fade">
      <div
        v-if="isShow"
        :class="$style.background"
        @click.left.exact.self.prevent.stop="onClose"
      />
    </Transition>

    <Transition name="nav-popover-animation">
      <AFlex
        v-if="isShow"
        :class="$style.body"
        vertical
        @keydown.esc="onClose"
      >
        <slot
          :close="onClose"
          name="default"
        />
      </AFlex>
    </Transition>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

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
    overscroll-behavior-y: contain;
    display: inline-block;

    width: calc(100vw - 16px);
    max-width: calc(100vw - 16px);
    max-height: calc(var(--max-vh) - 72px - var(--safe-area-inset-bottom));

    background-image: linear-gradient(
      135deg,
      rgba(35, 50, 59, 0.78),
      rgba(25, 20, 31, 0.78)
    );
    backdrop-filter: blur(16px);
    border-radius: 12px;
    box-shadow: 0 22px 122px rgb(0 0 0 / 78%);

    @include media-min($md) {
      top: 16px;
      bottom: inherit;
      left: 72px;
      transform-origin: top left;

      width: calc(100vw - 80px);
      max-width: 1170px;
    }
  }
</style>
