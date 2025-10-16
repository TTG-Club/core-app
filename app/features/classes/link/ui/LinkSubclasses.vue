<script setup lang="ts">
  import { ClassSubclassesDrawer } from '~classes/subclasses-drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(ClassSubclassesDrawer, {
    props: {
      url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });
</script>

<template>
  <button
    class="flex-auto cursor-pointer border-l border-default bg-transparent py-2 hover:bg-elevated @min-[500px]:py-3"
    @click.left.exact.prevent="drawer.open()"
  >
    Подклассы
  </button>
</template>
