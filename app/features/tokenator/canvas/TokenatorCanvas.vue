<script setup lang="ts">
  import { useGesture } from '@vueuse/gesture';
  import {
    useTokenatorCanvas,
    useTokenatorStore,
  } from '~tokenator/composables';
  import { getScaleFactor } from '~tokenator/model';

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

  const cursorX = ref(0);
  const cursorY = ref(0);
  const isHovering = ref(false);

  const isDragging = ref(false);
  const isPainting = ref(false);
  const startPos = { x: 0, y: 0 };
  const startTransformPos = { x: 0, y: 0 };
  const isDropZoneActive = ref(false);

  function onPointerDown(e: PointerEvent) {
    if (!store.currentImage) {
      return;
    }

    if (store.brush.enabled) {
      isPainting.value = true;

      if (containerRef.value) {
        containerRef.value.setPointerCapture(e.pointerId);

        // Initial paint
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

    const scaleFactor = getScaleFactor(containerRef.value);

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

  // Используем useGesture для плавного масштабирования на iOS
  useGesture(
    {
      onPinch: (arg) => {
        arg.event.preventDefault();

        if (!store.currentImage) {
          return;
        }

        store.transform.scale = Math.min(
          Math.max(store.transform.scale + arg.velocities[0] / 100, 0.1),
          3,
        );
      },
      onWheel: ({ event, delta: [, deltaY], ctrlKey }) => {
        // Игнорируем зум жесты (ctrl + wheel), так как они обрабатываются в onPinch
        if (ctrlKey) {
          return;
        }

        event.preventDefault();

        if (!store.currentImage) {
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
        rubberband: true,
      },
    },
  );

  function onDragEnter(e: DragEvent) {
    e.preventDefault();

    if (e.dataTransfer?.types.includes('Files')) {
      isDropZoneActive.value = true;
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function onDragLeave(e: DragEvent) {
    const relatedTarget = e.relatedTarget as Node | null;

    if (!containerRef.value?.contains(relatedTarget)) {
      isDropZoneActive.value = false;
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    isDropZoneActive.value = false;

    const files = e.dataTransfer?.files;

    if (!files?.length) {
      return;
    }

    const file = files[0];

    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    store.setImage(file);
  }

  onMounted(() => {
    initCanvas();
    render();
  });
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full overflow-hidden bg-muted"
    :class="{
      'cursor-none': store.brush.enabled,
      'cursor-grab': !store.brush.enabled && !isDragging,
      'cursor-grabbing': !store.brush.enabled && isDragging,
      'ring-2 ring-primary ring-inset': isDropZoneActive,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div
      v-if="store.brush.enabled && isHovering"
      class="pointer-events-none absolute z-50 rounded-full border border-white bg-white/20 shadow-[0_0_2px_rgba(0,0,0,0.5)]"
      :style="{
        left: `${cursorX}px`,
        top: `${cursorY}px`,
        width: `${store.brush.size}px`,
        height: `${store.brush.size}px`,
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
      class="relative z-10 size-full touch-none"
    />

    <CanvasDropZone v-if="isDropZoneActive" />

    <div
      v-else-if="!store.currentImage && !store.activeFrameUrl"
      class="absolute inset-0 z-10 flex items-center justify-center text-neutral-400"
    >
      <span class="text-sm">Загрузите изображение</span>
    </div>
  </div>
</template>
