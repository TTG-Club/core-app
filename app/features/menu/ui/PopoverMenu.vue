<script setup lang="ts">
  import { ref, watch } from 'vue';

  // Определение пропсов
  const props = withDefaults(
    defineProps<{
      modelValue?: boolean; // Управление видимостью через v-model
      innerScroll?: boolean; // Включить внутреннюю прокрутку
    }>(),
    {
      modelValue: false,
      innerScroll: false,
    },
  );

  // Определение событий
  interface IEmit {
    (e: 'close'): void; // Событие закрытия
    (e: 'update:modelValue', v: typeof props.modelValue): void; // Обновление modelValue
  }

  const emit = defineEmits<IEmit>();

  // Локальное состояние для управления видимостью
  const isShow = useVModel(props, 'modelValue'); // Двустороннее связывание через v-model
  const isShowPopover = ref(false); // Локальное состояние для фона

  // Метод закрытия попапа
  const onClose = () => {
    isShow.value = false; // Закрываем попап
    emit('close'); // Эмитим событие закрытия
  };

  // Наблюдатели для синхронизации состояний
  watch(isShow, (value) => {
    isShowPopover.value = value; // Синхронизируем фон с видимостью попапа
  });

  watch(isShowPopover, (value) => {
    if (!value && isShow.value) {
      isShow.value = false; // Если фон скрыт, но попап открыт, закрываем попап
    }
  });
</script>

<template>
  <div :class="$style.navPopover">
    <!-- Триггер -->
    <div :class="[{ 'is-active': isShow }, $style.navPopoverTrigger]">
      <slot
        :is-active="isShow"
        name="trigger"
      />
    </div>

    <!-- Фон -->
    <Transition name="fade">
      <div
        v-if="isShow"
        :class="$style.navPopoverBg"
        @click.left.exact.self.prevent.stop="onClose"
      />
    </Transition>

    <!-- Тело попапа -->
    <Transition name="navPopoverAnimation">
      <div
        v-if="isShow"
        :class="$style.navPopoverBody"
      >
        <slot
          :close="onClose"
          name="default"
        />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;
  @use '@/assets/styles/variables/index' as *;

  .navPopover {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
  }

  .navPopoverTrigger {
    position: relative;
    width: 100%;
    height: 100%;
    font-size: 24px;

    &.IsActive {
      z-index: 120;
    }
  }

  .navPopoverBg {
    cursor: pointer;

    position: fixed;
    z-index: 110;
    top: 0;
    left: 0;
    transform: translate3d(0, 0, 0);

    width: 100vw;
    height: var(--max-vh);

    background-color: rgba(19, 26, 32, 0.3);
  }

  .navPopoverBody {
    pointer-events: auto;
    cursor: auto;

    position: absolute;
    z-index: 111;
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
      rgba(35, 50, 59, 0.7803921569),
      rgba(25, 20, 31, 0.7803921569)
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
    z-index: 111;
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
