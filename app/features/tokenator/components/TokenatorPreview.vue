<script setup lang="ts">
  import { useTokenatorCanvas } from '../composables/useTokenatorCanvas';
  import { useTokenatorStore } from '../composables/useTokenatorStore';

  const store = useTokenatorStore();
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const { initCanvas, render } = useTokenatorCanvas(canvasRef);

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
    class="relative w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-md dark:border-neutral-800"
  >
    <div class="absolute inset-0 z-0 opacity-75">
      <img
        :src="'/s3/tokenator/terrane.webp'"
        alt="Background"
        class="h-full w-full object-cover"
      />
    </div>

    <div class="relative flex aspect-square w-full items-center justify-center">
      <div
        class="pointer-events-none absolute top-[calc(50%-120px)] right-0 left-0 z-20 h-px bg-neutral-500/40"
      ></div>

      <div
        class="pointer-events-none absolute top-[calc(50%+120px)] right-0 left-0 z-20 h-px bg-neutral-500/40"
      ></div>

      <div
        class="pointer-events-none absolute top-0 bottom-0 left-[calc(50%-120px)] z-20 w-px bg-neutral-500/40"
      ></div>

      <div
        class="pointer-events-none absolute top-0 bottom-0 left-[calc(50%+120px)] z-20 w-px bg-neutral-500/40"
      ></div>

      <div class="relative mx-auto h-[240px] w-[240px] shrink-0">
        <div
          class="pointer-events-none absolute rounded-full border border-neutral-200 dark:border-neutral-700"
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
    </div>
  </div>
</template>
