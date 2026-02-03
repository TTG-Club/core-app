<script setup lang="ts">
  import { useMediaQuery } from '@vueuse/core';
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
  const startPos = { x: 0, y: 0 };
  const startTransformPos = { x: 0, y: 0 };

  function onPointerDown(e: PointerEvent) {
    if (!isMobile.value || !store.currentImage) {
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

    if (containerRef.value) {
      containerRef.value.releasePointerCapture(e.pointerId);
    }
  }

  function onWheel(event: WheelEvent) {
    if (!isMobile.value || !store.currentImage) {
      return;
    }

    const zoomSpeed = 0.1;
    const delta = event.deltaY > 0 ? -1 : 1;
    const newScale = store.transform.scale + delta * zoomSpeed;

    store.transform.scale = Math.min(Math.max(newScale, 0.1), 3);
  }

  const lastPinchDistance = ref<number | null>(null);

  function onTouchStart(e: TouchEvent) {
    if (!isMobile.value || !store.currentImage) {
      return;
    }

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      if (touch1 && touch2) {
        lastPinchDistance.value = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
      }
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isMobile.value || !store.currentImage) {
      return;
    }

    if (e.touches.length === 2 && lastPinchDistance.value !== null) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      if (touch1 && touch2) {
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        const delta = currentDistance - lastPinchDistance.value;
        const zoomSpeed = 0.005;
        const newScale = store.transform.scale + delta * zoomSpeed;

        store.transform.scale = Math.min(Math.max(newScale, 0.1), 3);
        lastPinchDistance.value = currentDistance;
      }
    }
  }

  function onTouchEnd() {
    lastPinchDistance.value = null;
  }
</script>

<template>
  <div
    ref="containerRef"
    class="relative mx-auto h-[240px] w-[240px] shrink-0 touch-none"
    :class="{
      'cursor-grab': isMobile && store.currentImage,
      'cursor-grabbing': isDragging,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @wheel.prevent="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
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
