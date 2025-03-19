<script setup lang="ts">
  import { animate } from 'motion';

  import type { ToastProps } from '../types';
  import ToastItem from './ToastItem.vue';

  const { vertical, horizontal, toasts } = defineProps<{
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
    toasts: Array<ToastProps>;
  }>();

  const onGroupEnter = (el: Element, done: () => void) => {
    animate(
      el,
      {
        x: [horizontal === 'left' ? '-100%' : '100%', 0],
        opacity: 1,
      },
      {
        duration: 0.15,
      },
    ).then(() => {
      done();
    });
  };

  const onGroupLeave = (el: Element, done: () => void) => {
    animate(
      el,
      {
        y: vertical === 'top' ? '-100%' : '100%',
        opacity: 0,
        height: 0,
      },
      {
        duration: 0.15,
      },
    ).then(() => {
      done();
    });
  };
</script>

<template>
  <div :class="[$style.toastsGroup, $style[vertical], $style[horizontal]]">
    <ClientOnly>
      <TransitionGroup
        :css="false"
        @enter="onGroupEnter"
        @leave="onGroupLeave"
      >
        <ToastItem
          v-for="toast in toasts"
          v-bind="toast"
          :key="toast.id"
        />
      </TransitionGroup>
    </ClientOnly>
  </div>
</template>

<style module lang="scss">
  .toastsGroup {
    position: absolute;

    display: flex;
    flex-shrink: 0;
    gap: 16px;

    padding: 16px;

    &.top {
      top: 0;
      bottom: initial;
      flex-direction: column;

      &.left {
        right: initial;
        left: 0;
      }

      &.right {
        right: 0;
        left: initial;
      }
    }

    &.bottom {
      top: initial;
      bottom: 0;
      flex-direction: column-reverse;

      &.left {
        right: initial;
        left: 0;
      }

      &.right {
        right: 0;
        left: initial;
      }
    }
  }
</style>
