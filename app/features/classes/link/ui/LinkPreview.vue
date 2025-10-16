<script setup lang="ts">
  import { ClassDrawer } from '~classes/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(ClassDrawer, {
    props: {
      url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });
</script>

<template>
  <button
    class="flex-auto cursor-pointer bg-transparent py-2 hover:bg-elevated @min-[500px]:py-3"
    @click.left.exact.prevent.stop="drawer.open()"
  >
    Предпросмотр
  </button>
</template>
