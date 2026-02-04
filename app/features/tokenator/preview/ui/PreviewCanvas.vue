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
    () => store.editMode === 'brush' && !!store.currentImage,
  );

  /**
   * Генерирует SVG path для маски (круг или многоугольник).
   * Использует ту же логику, что и createMaskPath в draw.ts.
   *
   * @returns SVG path строка
   */
  const guidePath = computed(() => {
    const containerSize = 240; // размер контейнера h-60 w-60 = 240px
    const maskScale = store.transform.maskScale || 1;
    const baseRadiusPercent = 0.41;
    const radius = (containerSize / 2) * baseRadiusPercent * maskScale;

    const cx = containerSize / 2;
    const cy = containerSize / 2;
    const sides = store.transform.maskSides || 0;
    const rotation = store.transform.maskRotate || 0;

    if (sides === 0 || sides > 20) {
      // Круг
      return `M ${cx + radius}, ${cy}
              A ${radius},${radius} 0 1,1 ${cx - radius},${cy}
              A ${radius},${radius} 0 1,1 ${cx + radius},${cy} Z`;
    }

    // Многоугольник
    const angleStep = (Math.PI * 2) / sides;
    const rotationRad = (rotation * Math.PI) / 180;
    const points: string[] = [];

    for (let i = 0; i <= sides; i++) {
      const angle = i * angleStep + rotationRad - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      points.push(i === 0 ? `M ${x},${y}` : `L ${x},${y}`);
    }

    return `${points.join(' ')} Z`;
  });
</script>

<template>
  <div
    ref="containerRef"
    class="relative mx-auto h-60 w-60 shrink-0 touch-none"
    :class="{
      'cursor-none': isBrushMode,
      'cursor-grab':
        store.currentImage && store.editMode === 'none' && !isDragging,
      'cursor-grabbing': isDragging && store.editMode === 'none',
      'cursor-move': store.editMode === 'background',
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

    <!-- Guides (SVG для поддержки полигональных масок) -->
    <svg
      class="pointer-events-none absolute inset-0 z-0 size-full"
      viewBox="0 0 240 240"
    >
      <!-- Заливка фона -->
      <path
        :d="guidePath"
        fill="rgba(0, 0, 0, 0.4)"
      />

      <!-- Обводка -->
      <path
        :d="guidePath"
        fill="none"
        stroke="rgb(229, 229, 229)"
        stroke-width="1"
      />
    </svg>

    <canvas
      ref="canvasRef"
      class="relative z-10 size-full"
    />
  </div>
</template>
