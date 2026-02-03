<script setup lang="ts">
  import { PreviewBackground, PreviewCanvas } from './ui';
</script>

<template>
  <div
    class="relative w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-md"
  >
    <PreviewBackground />

    <div class="relative flex aspect-square w-full items-center justify-center">
      <!-- Grid Lines -->
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

      <PreviewCanvas />
    </div>
  </div>
</template>
