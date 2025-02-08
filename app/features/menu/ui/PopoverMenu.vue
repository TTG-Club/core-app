<script setup lang="ts">
  import { watch } from 'vue';
  import { useVModel } from '@vueuse/core';

  // Определение пропсов
  const props = withDefaults(
    defineProps<{
      modelValue?: boolean; // Управление видимостью через v-model
    }>(),
    {
      modelValue: false,
    },
  );

  // Определение событий
  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'update:modelValue', value: boolean): void;
  }>();

  const isShow = useVModel(props, 'modelValue', emit);

  // Следим за изменением состояния
  watch(isShow, (newVal) => {
    if (!newVal) {
      emit('close'); // Автоматически эмитим при закрытии
    }
  });

  // Упрощенный обработчик
  const onClose = () => {
    isShow.value = false;
  };
</script>

<template>
  <div :class="$style.navPopover">
    <!-- Триггер -->
    <div :class="[$style.trigger, { isActive: isShow }]">
      <slot
        :is-active="isShow"
        name="trigger"
      />
    </div>

    <!-- Фон -->
    <Transition>
      <div
        v-if="isShow"
        :class="$style.background"
        @click.left.exact.self.prevent.stop="onClose"
      />
    </Transition>

    <!-- Тело попапа -->
    <Transition name="navPopoverAnimation">
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

  // Анимация попапа (глобальные стили)
  :global(.navPopoverAnimation-enter-from),
  :global(.navPopoverAnimation-leave-to) {
    z-index: -1;
    transform: scale(0) translate3d(0, 0, 0);
    opacity: 0;
  }

  :global(.navPopoverAnimation-enter-to),
  :global(.navPopoverAnimation-leave-from) {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 1;
  }

  :global(.navPopoverAnimation-enter-active),
  :global(.navPopoverAnimation-leave-active) {
    @include css-anim(
      $time: 0.25s,
      $style: cubic-bezier(0.215, 0.61, 0.355, 1)
    );
  }
</style>
