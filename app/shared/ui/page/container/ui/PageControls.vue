<script setup lang="ts">
  import {
    useElementBounding,
    useWindowScroll,
    useWindowSize,
  } from '@vueuse/core';
  import { computed, ref, watch, type StyleValue } from 'vue';

  const wrapper = useTemplateRef('wrapper');
  const body = useTemplateRef('body');

  const { top: wrapperTop } = useElementBounding(wrapper);

  const {
    top: bodyTop,
    bottom: bodyBottom,
    height: bodyHeight,
  } = useElementBounding(body);

  const { height: windowHeight } = useWindowSize();
  const { y: scrollY } = useWindowScroll();

  const lastKnownY = ref(scrollY.value);
  const currentTop = ref(0);
  const isSticky = ref(false);

  const styles = computed<StyleValue>(() => ({
    position: isSticky.value ? 'sticky' : 'relative',
    top: `${currentTop.value}px`,
  }));

  const maxTop = computed(() => {
    if (!body.value || !wrapper.value) return 0;

    // Рассчитываем maxTop на основе wrapperTop и scrollY
    return wrapperTop.value + scrollY.value;
  });

  const minTop = computed(() => {
    if (!body.value) return 0;

    return bodyHeight.value - windowHeight.value;
  });

  function updatePosition() {
    if (!body.value || !wrapper.value) return;

    const deltaY = scrollY.value - lastKnownY.value;

    // Определяем направление скролла и обновляем позицию
    if (scrollY.value < lastKnownY.value) {
      currentTop.value -= deltaY; // Скролл вверх
    } else {
      currentTop.value += -deltaY; // Скролл вниз
    }

    // Ограничиваем позицию в пределах minTop и maxTop
    currentTop.value = Math.min(
      Math.max(currentTop.value, -minTop.value),
      maxTop.value,
    );

    lastKnownY.value = scrollY.value;

    // Обновляем sticky состояние
    isSticky.value = currentTop.value !== 0 || scrollY.value > wrapperTop.value;
  }

  // Реактивно обновляем позицию при изменении скролла или размеров
  watch(
    [scrollY, wrapperTop, bodyHeight, windowHeight],
    () => {
      updatePosition();
    },
    { immediate: true, flush: 'pre' },
  );
</script>

<template>
  <div
    ref="wrapper"
    :class="$style.controls"
    :style="{ minHeight: `${bodyHeight}px` }"
  >
    <div
      ref="body"
      :class="$style.body"
      :style="styles"
      :data-bt="bodyTop"
      :data-bb="bodyBottom"
      :data-max-bt="maxTop"
      :data-max-bb="minTop"
    >
      <slot />
    </div>
  </div>
</template>

<style module lang="scss">
  .controls {
    display: flex;
    flex: 1 0 100%;
    flex-direction: column;

    min-width: 288px;
    max-width: 320px;
    height: 100%;
  }

  .body {
    position: relative;
    top: 0;
    padding: 16px 0;
  }
</style>
