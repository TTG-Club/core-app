<script setup lang="ts">
  import {
    useTokenatorCanvas,
    useTokenatorGestures,
    useTokenatorStore,
  } from '~tokenator/composables';

  import { CanvasDropZone } from './ui';

  const store = useTokenatorStore();
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLElement | null>(null);

  const { initCanvas, render, paintMask, maskCanvas } = useTokenatorCanvas(
    canvasRef,
    {
      clip: false,
    },
  );

  store.maskImageCanvas = maskCanvas;

  const { isOverDropZone } = useDropZone(containerRef, {
    onDrop: (files) => {
      if (!files?.length) {
        return;
      }

      const file = files[0];

      if (!file || !file.type.startsWith('image/')) {
        return;
      }

      store.setImage(file);
    },
  });

  const { isDragging, isHovering, cursorX, cursorY } = useTokenatorGestures({
    containerRef,
    canvasRef,
    paintMask,
  });

  onMounted(() => {
    initCanvas();
    render();
  });

  const canvasTransform = computed(() => {
    const { zoom, pan } = store.canvasViewport;

    return `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`;
  });

  const isBrushMode = computed(
    () => store.editMode === 'brush' && !!store.currentImage,
  );

  const isPanningMode = computed(() => store.canvasViewport.isPanning);

  const brushCursorSize = computed(() => {
    return store.brush.size * store.canvasViewport.zoom;
  });
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full overflow-hidden rounded-2xl bg-muted shadow-xl"
    :class="{
      'cursor-none': isBrushMode,
      'cursor-grab':
        (store.editMode === 'none' || isPanningMode) && !isDragging,
      'cursor-grabbing':
        (store.editMode === 'none' || isPanningMode) && isDragging,
      'cursor-move': store.editMode === 'background',
      'ring-2 ring-primary ring-inset': isOverDropZone,
    }"
  >
    <div
      v-if="isBrushMode && isHovering"
      class="pointer-events-none absolute z-50 rounded-full border border-white bg-white/20 shadow-[0_0_2px_rgba(0,0,0,0.5)]"
      :style="{
        left: `${cursorX}px`,
        top: `${cursorY}px`,
        width: `${brushCursorSize}px`,
        height: `${brushCursorSize}px`,
        transform: 'translate(-50%, -50%)',
      }"
    />

    <div
      class="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,oklch(0.623_0.214_259.815/0.2)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.623_0.214_259.815/0.2)_1px,transparent_1px)] bg-size-[200px_200px] bg-center"
    ></div>

    <div
      class="absolute inset-0 bg-[radial-gradient(#888_1px,transparent_1px)] bg-size-[16px_16px] bg-center opacity-20"
    ></div>

    <canvas
      ref="canvasRef"
      class="relative z-10 size-full touch-none transition-transform duration-100"
      :style="{ transform: canvasTransform }"
    />

    <CanvasDropZone v-if="isOverDropZone" />

    <div
      v-else-if="!store.currentImage && !store.activeFrameUrl"
      class="absolute inset-0 z-10 flex items-center justify-center text-neutral-400"
    >
      <span class="text-sm">Загрузите изображение</span>
    </div>
  </div>
</template>
