<script setup lang="ts">
  import { useMediaQuery } from '@vueuse/core';
  import { useGesture } from '@vueuse/gesture';
  import {
    useTokenatorCanvas,
    useTokenatorStore,
  } from '~tokenator/composables';
  import { getScaleFactor } from '~tokenator/model';

  const store = useTokenatorStore();
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLElement | null>(null);

  const { initCanvas, render } = useTokenatorCanvas(canvasRef);

  const isMobile = useMediaQuery('(max-width: 1023px)');

  /**
   * Рисует на маске в указанных координатах.
   * Использует maskImageCanvas из стора (общий с TokenatorCanvas).
   * Координаты пересчитываются из системы координат превью в систему координат maskImageCanvas
   * с учётом центрирования токена и соотношения размеров.
   *
   * @param x - Координата X в контейнере превью
   * @param y - Координата Y в контейнере превью
   */
  function paintMask(x: number, y: number) {
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

    // Масштабируем размер кисти
    const scaledBrushSize = (store.brush.size / 2) * scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, scaledBrushSize, 0, Math.PI * 2);
    ctx.fillStyle = store.brush.mode === 'add' ? 'white' : 'black';

    if (store.brush.mode === 'remove') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.fill();
    ctx.restore();

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

  const isDragging = ref(false);
  const isPainting = ref(false);
  const isHovering = ref(false);
  const cursorX = ref(0);
  const cursorY = ref(0);
  const startPos = { x: 0, y: 0 };
  const startTransformPos = { x: 0, y: 0 };

  const isBrushMode = computed(
    () => isMobile.value && store.brush.enabled && store.currentImage,
  );

  function onPointerDown(e: PointerEvent) {
    if (!isMobile.value || !store.currentImage) {
      return;
    }

    if (store.brush.enabled) {
      isPainting.value = true;

      if (containerRef.value) {
        containerRef.value.setPointerCapture(e.pointerId);

        const rect = containerRef.value.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        paintMask(x, y);
      }

      return;
    }

    isDragging.value = true;
    startPos.x = e.clientX;
    startPos.y = e.clientY;
    startTransformPos.x = store.transform.position.x;
    startTransformPos.y = store.transform.position.y;

    if (containerRef.value) {
      containerRef.value.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect();

      cursorX.value = e.clientX - rect.left;
      cursorY.value = e.clientY - rect.top;
    }

    if (isPainting.value) {
      paintMask(cursorX.value, cursorY.value);

      return;
    }

    if (!isDragging.value) {
      return;
    }

    const scaleFactor = getScaleFactor(containerRef.value, 500);

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    store.transform.position.x = startTransformPos.x + deltaX * scaleFactor;
    store.transform.position.y = startTransformPos.y + deltaY * scaleFactor;
  }

  function onPointerUp(e: PointerEvent) {
    isDragging.value = false;
    isPainting.value = false;

    if (containerRef.value) {
      containerRef.value.releasePointerCapture(e.pointerId);
    }
  }

  function onPointerEnter() {
    isHovering.value = true;
  }

  function onPointerLeave() {
    isHovering.value = false;
    isPainting.value = false;
  }

  // Используем useGesture для плавного масштабирования
  useGesture(
    {
      onPinch: ({ offset: [scale] }) => {
        if (!isMobile.value || !store.currentImage || store.brush.enabled) {
          return;
        }

        // Применяем масштаб с ограничениями
        const newScale = Math.min(Math.max(scale, 0.1), 3);

        store.transform.scale = newScale;
      },
      onWheel: ({ delta: [, deltaY] }) => {
        if (!isMobile.value || !store.currentImage || store.brush.enabled) {
          return;
        }

        // Уменьшенная чувствительность для колеса мыши
        const zoomSpeed = 0.001;
        const newScale = store.transform.scale - deltaY * zoomSpeed;

        store.transform.scale = Math.min(Math.max(newScale, 0.1), 3);
      },
    },
    {
      domTarget: containerRef,
      eventOptions: { passive: false },
      pinch: {
        distanceBounds: { min: 0.1, max: 3 },
        rubberband: true,
      },
    },
  );
</script>

<template>
  <div
    ref="containerRef"
    class="relative mx-auto h-[240px] w-[240px] shrink-0 touch-none"
    :class="{
      'cursor-none': isBrushMode,
      'cursor-grab': isMobile && store.currentImage && !store.brush.enabled,
      'cursor-grabbing': isDragging,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
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
