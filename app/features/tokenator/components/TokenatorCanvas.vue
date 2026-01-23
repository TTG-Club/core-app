<script setup lang="ts">
  import { useTokenatorCanvas } from '../composables/useTokenatorCanvas';
  import { useTokenatorStore } from '../composables/useTokenatorStore';

  const store = useTokenatorStore();
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLElement | null>(null);

  const { initCanvas, render } = useTokenatorCanvas(canvasRef, {
    clip: false,
  });

  onMounted(() => {
    initCanvas();
    render();
  });

  // Drag Logic
  const isDragging = ref(false);
  const startPos = { x: 0, y: 0 };
  const startTransformPos = { x: 0, y: 0 };

  function getScaleFactor() {
    if (!containerRef.value) {
      return 1;
    }

    const rect = containerRef.value.getBoundingClientRect();

    if (rect.width === 0) {
      return 1;
    }

    return 1000 / rect.width;
  }

  function onPointerDown(e: PointerEvent) {
    if (!store.currentImage) {
      return;
    } // Only drag if image exists

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
    if (!isDragging.value) {
      return;
    }

    const scaleFactor = getScaleFactor();

    // Calculate delta in screen pixels
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // Convert to canvas pixels
    // Adjust for rotation?
    // If we simple add to x/y, we move the center. That's fine for "pan".
    // However, we might want to scale the movement by the current image 'scale'
    // if we want "1:1" feeling, but usually moving "canvas pixels" is consistent.
    // BUT we must adjust for the CSS display size ratio (scaleFactor).

    store.transform.position.x = startTransformPos.x + deltaX * scaleFactor;
    store.transform.position.y = startTransformPos.y + deltaY * scaleFactor;
  }

  function onPointerUp(e: PointerEvent) {
    isDragging.value = false;

    if (containerRef.value) {
      containerRef.value.releasePointerCapture(e.pointerId);
    }
  }

  function onWheel(event: WheelEvent) {
    if (!store.currentImage) {
      return;
    }

    const zoomSpeed = 0.1;
    // deltaY > 0 -> scroll down -> zoom out
    // deltaY < 0 -> scroll up -> zoom in
    const delta = event.deltaY > 0 ? -1 : 1;
    const newScale = store.transform.scale + delta * zoomSpeed;

    // Clamp between 0.1 and 3
    store.transform.scale = Math.min(Math.max(newScale, 0.1), 3);
  }
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full cursor-grab overflow-hidden bg-muted"
    :class="{ 'cursor-grabbing': isDragging }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @wheel.prevent="onWheel"
  >
    <!-- Checkerboard background for transparency indication -->
    <div
      class="absolute inset-0 bg-[radial-gradient(#888_1px,transparent_1px)] bg-[length:16px_16px] opacity-20"
    ></div>

    <canvas
      ref="canvasRef"
      class="relative z-10 size-full touch-none"
    />

    <div
      v-if="!store.currentImage && !store.activeFrameUrl"
      class="absolute inset-0 flex items-center justify-center text-neutral-400"
    >
      <span class="text-sm">Загрузите изображение</span>
    </div>
  </div>
</template>
