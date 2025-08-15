<script setup lang="ts">
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(SpeciesLineagesDrawer, {
    props: {
      url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });
</script>

<template>
  <button
    class="flex-auto cursor-pointer border-l border-default bg-transparent py-3 hover:bg-elevated"
    @click.left.exact.prevent.stop="drawer.open()"
  >
    Происхождения
  </button>
</template>
