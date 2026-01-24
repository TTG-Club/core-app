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

  // Image Drag Logic (moving the image)
  const isDragging = ref(false);
  const startPos = { x: 0, y: 0 };
  const startTransformPos = { x: 0, y: 0 };

  // File Drop Logic
  const isDropZoneActive = ref(false);

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
    const delta = event.deltaY > 0 ? -1 : 1;
    const newScale = store.transform.scale + delta * zoomSpeed;

    store.transform.scale = Math.min(Math.max(newScale, 0.1), 3);
  }

  // File Drop Handlers
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
    // Only deactivate if leaving the container entirely
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

    // Check if file exists and is an image
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    store.setImage(file);
  }
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full cursor-grab overflow-hidden bg-muted"
    :class="{
      'cursor-grabbing': isDragging,
      'ring-2 ring-primary ring-inset': isDropZoneActive,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @wheel.prevent="onWheel"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Checkerboard background for transparency indication -->
    <div
      class="absolute inset-0 bg-[radial-gradient(#888_1px,transparent_1px)] bg-[length:16px_16px] opacity-20"
    ></div>

    <canvas
      ref="canvasRef"
      class="relative z-10 size-full touch-none"
    />

    <!-- Drop Zone Overlay -->
    <div
      v-if="isDropZoneActive"
      class="absolute inset-0 z-20 flex items-center justify-center bg-primary/10"
    >
      <div class="flex flex-col items-center gap-2 text-primary">
        <UIcon
          name="i-heroicons-arrow-down-tray"
          class="size-12"
        />

        <span class="text-lg font-medium">Отпустите для загрузки</span>
      </div>
    </div>

    <div
      v-else-if="!store.currentImage && !store.activeFrameUrl"
      class="absolute inset-0 z-10 flex items-center justify-center text-neutral-400"
    >
      <span class="text-sm">Загрузите изображение</span>
    </div>
  </div>
</template>
