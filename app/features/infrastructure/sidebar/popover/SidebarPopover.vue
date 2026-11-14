<script setup lang="ts">
  import { onKeyDown } from '@vueuse/core';

  const { popoverKey } = defineProps<{
    popoverKey: string;
    bottom?: boolean;
    isMenu?: boolean;
  }>();

  const isScrollLocked = useScrollLock(window);
  const { close, open, toggle, isOpened } = useSidebarPopover(popoverKey);

  // По кадрам открытия сайт понимает, тянет ли устройство размытие фона
  const graphicsProbe = useGraphicsProbe();

  /**
   * Содержимое панели собрано. Сборка меню из десятков кнопок занимает
   * десятки миллисекунд — если делать её по клику, анимация открытия
   * начинается с рывка. Поэтому панель собирается один раз в простое после
   * загрузки страницы и дальше только прячется и показывается.
   */
  const isRendered = ref(false);

  onNuxtReady(() => {
    isRendered.value = true;
  });

  /**
   * При открытии возвращает панель к началу: она не пересоздаётся и помнит
   * прокрутку с прошлого раза.
   *
   * @param element - панель
   */
  function resetScroll(element: Element): void {
    element.scrollTop = 0;
  }

  onKeyDown('Escape', (e: KeyboardEvent) => {
    if (!isOpened.value) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    close();
  });

  watch(
    isOpened,
    (value) => {
      // Открыли раньше, чем страница дошла до простоя
      if (value) {
        isRendered.value = true;
      }

      isScrollLocked.value = value;
    },
    {
      immediate: true,
      flush: 'post',
    },
  );
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
        :class="[$style.background, { [$style.isMenu]: isMenu }]"
        @click.left.exact.self.prevent.stop="close()"
      />
    </Transition>

    <!--
      Условие сборки стоит на самой анимации, а не на панели: иначе заранее
      собранная скрытая панель «открывалась» бы для неё и портила замер
      плавности.
    -->
    <Transition
      v-if="isRendered"
      name="nav-popover-animation"
      @before-enter="graphicsProbe.start"
      @enter="resetScroll"
      @after-enter="graphicsProbe.finish"
      @enter-cancelled="graphicsProbe.cancel"
    >
      <!-- Без размытия полупрозрачная панель нечитаема: в режиме
        «производительность» под градиент ложится плотный фон -->
      <div
        v-show="isOpened"
        :class="[
          $style.body,
          {
            [$style.isMenu]: isMenu,
            [$style.bottom]: bottom,
          },
        ]"
        class="flex flex-col border border-default bg-linear-(--color-bg-menu) shadow-2xl backdrop-blur-lg performance:bg-default"
      >
        <slot
          :close="() => close()"
          name="default"
        />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" module>
  @use 'assets/css/variables/breakpoints' as *;
  @use 'assets/css/variables/mixins' as *;

  $horizontalMargin: 72px;
  $verticalMargin: 16px;

  // Меню держится компактной панелью у навигации, а не полосой во весь экран:
  // четыре колонки разделов (см. AppMenu) читаются одним взглядом.
  $menuMaxWidth: 1040px;

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

    overscroll-behavior: contain;

    width: 100vw;
    height: 100dvh;

    background-color: var(--color-overlay);

    // Под меню страница дополнительно размывается, чтобы не спорить с ним
    &.isMenu {
      backdrop-filter: blur(4px);
    }
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
    overscroll-behavior: contain;
    display: inline-block;

    width: fit-content;
    max-width: calc(100vw - 16px);
    max-height: calc(100dvh - 72px - var(--safe-area-inset-bottom));
    border-radius: 12px;

    @include media-min($md) {
      top: $verticalMargin;
      bottom: inherit;
      left: $horizontalMargin;
      transform-origin: top left;

      max-width: 1100px;
    }

    &.isMenu {
      width: calc(100vw - 16px);

      @include media-min($md) {
        width: calc(100vw - 56px - 24px);
        max-width: $menuMaxWidth;
      }
    }

    &.bottom {
      top: initial;
      right: 8px;
      left: initial;
      transform-origin: bottom right;

      @include media-min($md) {
        top: auto;
        right: initial;
        bottom: $verticalMargin;
        left: $horizontalMargin;
        transform-origin: bottom left;
      }
    }
  }
</style>
