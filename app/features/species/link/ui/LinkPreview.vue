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
  <UButton
    icon="i-ttg-search"
    size="md"
    color="neutral"
    variant="soft"
    @click.left.exact.prevent.stop="drawer.open()"
  />
</template>
