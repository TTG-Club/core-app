<script setup lang="ts">
  import type { ToastProps } from '../types';
  import { SvgIcon } from '~ui/icon';

  const props = defineProps<ToastProps>();

  const timerId = ref<ReturnType<typeof setTimeout>>();
  const startTimerTime = ref<ReturnType<typeof Date.now>>();
  const remainingDuration = ref<typeof props.duration>();

  const iconColor = computed(() => {
    if (!props.type) {
      return undefined;
    }

    if (props.type === 'info') {
      return 'var(--color-primary)';
    }

    return `var(--color-${props.type})`;
  });

  const isCloseHidden = computed(() => {
    if (!props.duration) {
      return false;
    }

    return props.hideCloseButton;
  });

  onMounted(() => {
    if (props.mounted) {
      props.mounted(props.id);
    }

    if (props.duration) {
      remainingDuration.value = props.duration;

      resumeTimer();
    }
  });

  onBeforeUnmount(() => {
    remainingDuration.value = undefined;

    clearTimeout(timerId.value);

    timerId.value = undefined;
  });

  function resumeTimer() {
    if (!remainingDuration.value) {
      return;
    }

    startTimerTime.value = Date.now();

    timerId.value = setTimeout(() => {
      props.close();
    }, remainingDuration.value);
  }

  function pauseTimer() {
    if (!remainingDuration.value || !startTimerTime.value) {
      return;
    }

    clearTimeout(timerId.value);

    remainingDuration.value -= Date.now() - startTimerTime.value;
  }
</script>

<template>
  <div
    :class="$style.toast"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
  >
    <AFlex
      :class="$style.container"
      gap="12"
      vertical
    >
      <AFlex
        align="flex-start"
        gap="12"
      >
        <div
          v-if="icon"
          :class="$style.icon"
          :style="{ color: iconColor }"
        >
          <SvgIcon :icon="icon" />
        </div>

        <AFlex
          :class="$style.body"
          gap="8"
          vertical
        >
          <div :class="$style.title">
            <component :is="title" />
          </div>

          <component
            :is="description"
            v-if="description"
          />
        </AFlex>
      </AFlex>

      <AFlex
        v-if="buttons"
        justify="flex-end"
        align="center"
        wrap="wrap"
        gap="12"
      >
        <component
          :is="button"
          v-for="(button, index) in buttons"
          :key="index"
        />
      </AFlex>
    </AFlex>

    <AButton
      v-if="!isCloseHidden"
      :class="$style.close"
      size="small"
      type="text"
      @click.left.exact.prevent="close"
    >
      <template #icon>
        <SvgIcon icon="close" />
      </template>
    </AButton>
  </div>
</template>

<style module lang="scss">
  .toast {
    pointer-events: initial;
    will-change: transform, opacity, height, max-height;

    position: relative;

    overflow: hidden;
    flex-shrink: 0;

    width: 384px;
    max-width: calc(100vw - 32px);
    border-radius: 8px;

    background: var(--color-bg-secondary);
    box-shadow:
      0 6px 16px 0 rgba(0, 0, 0, 0.08),
      0 3px 6px -4px rgba(0, 0, 0, 0.12),
      0 9px 28px 8px rgba(0, 0, 0, 0.05);
  }

  .container {
    width: 100%;
    padding: 20px 24px;
  }

  .icon {
    font-size: 24px;
    line-height: 1em;
  }

  .body {
    flex: 1;
  }

  .title {
    padding-right: 40px;
    font-size: 16px;
    line-height: 24px;
  }

  .close {
    position: absolute;
    top: 20px;
    right: 24px;
  }
</style>
