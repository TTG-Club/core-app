<script setup lang="ts">
  import { MulticlassDrawer } from '~multiclass/drawer';

  const overlay = useOverlay();

  const multiclassDrawer = overlay.create(MulticlassDrawer, {
    props: {
      url: '',
      name: {
        rus: '',
        eng: '',
      },
      parent: undefined,
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
      <UButton
        variant="soft"
        color="primary"
        block
        @click.left.exact.prevent.stop="multiclassDrawer.open()"
      >
        Создать мультикласс
      </UButton>
    </div>
  </div>
</template>
