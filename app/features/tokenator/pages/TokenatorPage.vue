<script setup lang="ts">
  import TokenatorCanvas from '../components/TokenatorCanvas.vue';
  import TokenatorControls from '../components/TokenatorControls.vue';
  import TokenatorPreview from '../components/TokenatorPreview.vue';
</script>

<template>
  <div class="flex h-full flex-col gap-6 lg:flex-row lg:gap-8">
    <!-- Left Sidebar: Preview & Controls -->
    <div
      class="lg:page-h flex shrink-0 flex-col gap-4 lg:w-80 lg:overflow-hidden lg:pr-1"
    >
      <!-- Preview (Fixed) -->
      <div class="flex shrink-0 flex-col items-center justify-center pt-0 pb-2">
        <div class="aspect-square w-full max-w-[200px]">
          <TokenatorPreview />
        </div>
      </div>

      <!-- Controls (Scrollable) -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <TokenatorControls />
      </div>
    </div>

    <!-- Right Area: Editor -->
    <div
      class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-neutral-900 lg:h-[calc(100vh-140px)] lg:rounded-2xl"
    >
      <h2
        class="absolute top-0 right-0 left-0 z-50 mb-4 bg-neutral-900/80 p-4 text-xl font-bold backdrop-blur-sm lg:hidden"
      >
        Редактор
      </h2>

      <div class="absolute inset-0 h-full w-full">
        <TokenatorCanvas />
      </div>
    </div>
  </div>
</template>
