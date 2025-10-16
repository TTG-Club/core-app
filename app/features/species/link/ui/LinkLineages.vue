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
  <UButton
    icon="i-ttg-new-page"
    size="md"
    color="neutral"
    variant="soft"
    @click.left.exact.prevent.stop="drawer.open()"
  />
</template>
