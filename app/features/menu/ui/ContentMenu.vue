<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: boolean; // Тип boolean, не optional, так как у нас есть значение по умолчанию
      placement?: string; // Optional, тип string
      offset?: number; // Optional, тип number
      topOffset?: number; // Optional, тип number
    }>(),
    {
      modelValue: false, // Значение по умолчанию для modelValue
      placement: 'right', // Значение по умолчанию для placement
      offset: 10, // Значение по умолчанию для offset
      topOffset: 10, // Значение по умолчанию для topOffset
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void; // Определяем событие и тип его параметра
  }>();

  const isOpen = ref(props.modelValue);
  const trigger = ref<HTMLElement | null>(null); // Ссылка на триггер (кнопку)
  const menuWrapper = ref<HTMLElement | null>(null); // Ссылка на обертку компонента
  const menuContent = ref<HTMLElement | null>(null); // Ссылка на всплывающее окно
  const overlay = ref<HTMLElement | null>(null); // Ссылка на оверлей

  // Позиционирование содержимого
  const contentPosition = ref({});

  const toggleMenu = () => {
    isOpen.value = !isOpen.value;
    emit('update:modelValue', true);

    if (isOpen.value) {
      nextTick(() => {
        moveElementsToBody();
        positionMenu();
      });
    } else {
      removeElementsFromBody();
    }
  };

  // Вспомогательная функция для перемещения элемента
  const moveElement = (
    element: HTMLElement | null,
    targetParent: HTMLElement | null,
  ) => {
    if (element && element.parentNode !== targetParent) {
      targetParent?.appendChild(element);
    }
  };

  // Перемещение элементов в <body>
  const moveElementsToBody = () => {
    moveElement(menuContent.value, document.body);
    moveElement(overlay.value, document.body);
  };

  // Возвращение элементов обратно в обертку
  const removeElementsFromBody = () => {
    moveElement(menuContent.value, menuWrapper.value);
    moveElement(overlay.value, menuWrapper.value);
  };

  // Функция для позиционирования меню
  const positionMenu = () => {
    if (trigger.value && menuContent.value) {
      const triggerRect = trigger.value.getBoundingClientRect();

      if (props.placement === 'right') {
        contentPosition.value = {
          top: `${props.topOffset}px`, // Прижимаем к верху с отступом
          left: `${triggerRect.right + props.offset}px`, // Размещаем справа с отступом
        };
      }
    }
  };

  // Закрытие меню при клике на затемнение
  const closeMenu = () => {
    isOpen.value = false;
    emit('update:modelValue', false);
  };

  // Наблюдаем за изменением пропса modelValue
  watch(
    () => props.modelValue,
    (newVal) => {
      isOpen.value = newVal;

      if (isOpen.value) {
        nextTick(() => {
          moveElementsToBody();
          positionMenu();
        });
      } else {
        removeElementsFromBody();
      }
    },
  );
</script>

<template>
  <div
    ref="menuWrapper"
    :class="$style.contentMenu"
  >
    <!-- Триггер -->
    <div
      ref="trigger"
      @click="toggleMenu"
    >
      <slot name="default"></slot>
    </div>

    <!-- Всплывающее окно -->
    <div
      v-if="isOpen"
      ref="menuContent"
      :class="$style.menuContent"
      :style="contentPosition"
    >
      <slot name="content"></slot>
    </div>

    <!-- Затемнение фона -->
    <div
      v-if="isOpen"
      ref="overlay"
      :class="$style.overlay"
      @click="closeMenu"
    ></div>
  </div>
</template>

<style lang="scss" module>
  .contentMenu {
    position: relative;
    display: inline-block;
  }

  .menuContent {
    position: absolute;
    z-index: 9999;

    max-width: 1170px;
    padding: 10px;

    background-image: linear-gradient(
      135deg,
      rgba(35, 50, 59, 0.7803921569),
      rgba(25, 20, 31, 0.7803921569)
    );
    backdrop-filter: blur(16px);
    border-radius: 12px;
    box-shadow: 0 22px 122px rgba(0, 0, 0, 0.78);
  }

  .overlay {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    background: rgba(0, 0, 0, 0.35);
  }
</style>
