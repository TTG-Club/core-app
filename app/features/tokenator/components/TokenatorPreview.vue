<script setup lang="ts">
  import { useTokenatorCanvas } from '../composables/useTokenatorCanvas';

  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const { initCanvas, render } = useTokenatorCanvas(canvasRef);

  onMounted(() => {
    initCanvas();
    render();
  });
</script>

<template>
  <div
    class="relative aspect-square w-full overflow-hidden rounded-full border border-neutral-200 shadow-md dark:border-neutral-800"
  >
    <!-- Checkerboard -->
    <div
      class="absolute inset-0 z-0 bg-[radial-gradient(#888_1px,transparent_1px)] bg-[length:8px_8px] opacity-20"
    ></div>

    <canvas
      ref="canvasRef"
      class="relative z-10 size-full"
    />
  </div>
</template>
