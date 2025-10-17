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
    icon="i-fluent-preview-link-16-regular"
    size="md"
    color="neutral"
    variant="soft"
    @click.left.exact.prevent.stop="drawer.open()"
  />
</template>
