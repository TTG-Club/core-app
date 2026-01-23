<script setup lang="ts">
  import { useTokenatorCanvas } from '../composables/useTokenatorCanvas';
  import { useTokenatorStore } from '../composables/useTokenatorStore';

  const store = useTokenatorStore();
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const { initCanvas, render } = useTokenatorCanvas(canvasRef);

  // Dynamic inset for guide circle based on maskScale
  // basePadding = 45/500 = 9%, so baseRadius = 50% - 9% = 41%
  // maskRadius = 41% * maskScale, inset = 50% - maskRadius
  const guideInset = computed(() => {
    const maskScale = store.transform.maskScale || 1;
    const baseRadiusPercent = 41; // 50% - 9% (basePadding)
    const maskRadiusPercent = baseRadiusPercent * maskScale;

    return `${50 - maskRadiusPercent}%`;
  });

  onMounted(() => {
    initCanvas();
    render();
  });
</script>

<template>
  <div
    class="relative w-full rounded-2xl border border-neutral-200 shadow-md dark:border-neutral-800"
  >
    <!-- Background: Checkerboard -->
    <div
      class="absolute inset-0 z-0 bg-[radial-gradient(#888_1px,transparent_1px)] bg-[length:16px_16px] opacity-20"
    ></div>

    <!-- Inner Area -->
    <div class="relative flex aspect-square w-full items-center justify-center">
      <div class="relative mx-auto h-[240px] w-[240px] shrink-0">
        <!-- Link/Circle Guide -->
        <div
          class="pointer-events-none absolute rounded-full border border-neutral-200 dark:border-neutral-700"
          :style="{ inset: guideInset }"
        ></div>

        <!-- Token Dark Background -->
        <div
          class="pointer-events-none absolute rounded-full bg-black/40"
          :style="{ inset: guideInset }"
        ></div>

        <!-- Canvas -->
        <canvas
          ref="canvasRef"
          class="relative z-10 size-full"
        />
      </div>
    </div>
  </div>
</template>
