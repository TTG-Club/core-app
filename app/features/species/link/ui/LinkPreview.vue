<script setup lang="ts">
  import { SpeciesDrawer } from '~species/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(SpeciesDrawer, {
    props: {
      url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });
</script>

<template>
  <button
    class="flex-auto cursor-pointer bg-transparent py-3 hover:bg-(--color-hover)"
    @click.left.exact.prevent.stop="drawer.open()"
  >
    Предпросмотр
  </button>
</template>
