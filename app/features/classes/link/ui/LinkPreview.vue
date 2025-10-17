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
  <UButton
    icon="i-fluent-preview-link-16-regular"
    variant="ghost"
    color="neutral"
    @click.left.exact.prevent.stop="drawer.open()"
  />
</template>
