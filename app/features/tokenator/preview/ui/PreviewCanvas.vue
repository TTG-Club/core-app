<script setup lang="ts">
  import {
    useTokenatorCanvas,
    useTokenatorGestures,
    useTokenatorStore,
  } from '~tokenator/composables';
  import { drawBrushStroke } from '~tokenator/model';

  const store = useTokenatorStore();
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLElement | null>(null);

  const { isDesktop } = useBreakpoints();

  const { initCanvas, render } = useTokenatorCanvas(canvasRef);

  /**
   * Рисует на маске в указанных координатах.
   * Использует maskImageCanvas из стора (общий с TokenatorCanvas).
   * Координаты пересчитываются из системы координат превью в систему координат maskImageCanvas
   * с учётом центрирования токена и соотношения размеров.
   *
   * @param x - Координата X в контейнере превью
   * @param y - Координата Y в контейнере превью
   * @param prevX - Предыдущая координата X (для интерполяции)
   * @param prevY - Предыдущая координата Y (для интерполяции)
   */
  function paintMask(x: number, y: number, prevX?: number, prevY?: number) {
    if (!store.maskImageCanvas || !containerRef.value) {
      return;
    }

    const ctx = store.maskImageCanvas.getContext('2d');

    if (!ctx) {
      return;
    }

    // Размеры превью контейнера
    const containerRect = containerRef.value.getBoundingClientRect();
    const previewWidth = containerRect.width;
    const previewHeight = containerRect.height;

    // Размеры maskImageCanvas (из основного редактора)
    const maskWidth = store.maskImageCanvas.width;
    const maskHeight = store.maskImageCanvas.height;

    // Центры обоих canvas
    const previewCx = previewWidth / 2;
    const previewCy = previewHeight / 2;
    const maskCx = maskWidth / 2;
    const maskCy = maskHeight / 2;

    // Размер токена в превью vs размер токена при создании маски
    const previewTokenSize = Math.min(previewWidth, previewHeight);

    const maskTokenSize =
      store.maskTokenSize || Math.min(maskWidth, maskHeight);

    // Коэффициент масштабирования между превью и маской
    const scale = maskTokenSize / previewTokenSize;

    // Переводим координаты из превью в маску:
    // 1. Смещаем относительно центра превью
    // 2. Масштабируем
    // 3. Смещаем относительно центра маски
    const scaledX = (x - previewCx) * scale + maskCx;
    const scaledY = (y - previewCy) * scale + maskCy;

    let scaledPrevX: number | undefined;
    let scaledPrevY: number | undefined;

    if (prevX !== undefined && prevY !== undefined) {
      scaledPrevX = (prevX - previewCx) * scale + maskCx;
      scaledPrevY = (prevY - previewCy) * scale + maskCy;
    }

    drawBrushStroke({
      ctx,
      x: scaledX,
      y: scaledY,
      prevX: scaledPrevX,
      prevY: scaledPrevY,
      size: store.brush.size * scale,
      mode: store.brush.mode,
      color: store.brush.mode === 'add' ? 'white' : 'black',
    });

    store.maskVersion++;
    render();
  }

  const guideInset = computed(() => {
    const maskScale = store.transform.maskScale || 1;
    const baseRadiusPercent = 41;
    const maskRadiusPercent = baseRadiusPercent * maskScale;

    return `${50 - maskRadiusPercent}%`;
  });

  onMounted(() => {
    initCanvas();
    render();
  });

  const { isDragging, isHovering, cursorX, cursorY } = useTokenatorGestures({
    containerRef,
    canvasRef,
    paintMask,
    scaleReferenceSize: 500,
    disabled: isDesktop,
  });

  const isBrushMode = computed(
    () => store.brush.enabled && !!store.currentImage,
  );
</script>

<template>
  <div
    ref="containerRef"
    class="relative mx-auto h-60 w-60 shrink-0 touch-none"
    :class="{
      'cursor-none': isBrushMode,
      'cursor-grab': store.currentImage && !store.brush.enabled && !isDragging,
      'cursor-grabbing': isDragging,
    }"
  >
    <!-- Brush Cursor -->
    <div
      v-if="isBrushMode && isHovering"
      class="pointer-events-none absolute z-50 rounded-full border border-white bg-white/20 shadow-[0_0_2px_rgba(0,0,0,0.5)]"
      :style="{
        left: `${cursorX}px`,
        top: `${cursorY}px`,
        width: `${store.brush.size}px`,
        height: `${store.brush.size}px`,
        transform: 'translate(-50%, -50%)',
      }"
    />

    <!-- Guides -->
    <div
      class="pointer-events-none absolute rounded-full border border-neutral-200"
      :style="{ inset: guideInset }"
    ></div>

    <div
      class="pointer-events-none absolute rounded-full bg-black/40"
      :style="{ inset: guideInset }"
    ></div>

    <canvas
      ref="canvasRef"
      class="relative z-10 size-full"
    />
  </div>
</template>
