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
    icon="i-fluent-row-child-16-regular"
    variant="subtle"
    color="neutral"
    @click.left.exact.prevent.stop="drawer.open()"
  />
</template>
