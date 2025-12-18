<script setup lang="ts">
  import { MulticlassDrawer } from '~classes/multiclass-drawer';

  const overlay = useOverlay();

  const multiclassDrawer = overlay.create(MulticlassDrawer, {
    props: {
      currentUrl: '',
      currentName: {
        rus: '',
        eng: '',
      },
      currentParent: undefined,
      onClose: () => multiclassDrawer.close(),
    },
    destroyOnClose: true,
  });
</script>

<template>
  <div
    class="flex w-full flex-col gap-3 rounded-lg border border-default bg-muted p-3 shadow-lg"
  >
    <h2 class="text-base leading-none font-medium">Инструменты</h2>

    <div class="flex flex-col gap-3">
      <button
        :class="[
          'flex items-center justify-center',
          'h-10 rounded-lg px-3',
          'border border-blue-500 bg-muted',
          'transition-colors duration-200 hover:bg-elevated',
          'cursor-pointer',
        ]"
        @click.left.exact.prevent.stop="multiclassDrawer.open()"
      >
        <span class="font-medium">Создать мультикласс</span>
      </button>
    </div>
  </div>
</template>
