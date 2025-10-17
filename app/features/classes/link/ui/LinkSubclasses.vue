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
  <UButton
    icon="i-fluent-row-child-16-regular"
    size="md"
    color="neutral"
    variant="soft"
    @click.left.exact.prevent="drawer.open()"
  />
</template>
