<script setup lang="ts">
  import { useTheme } from '~/shared/composables';

  const { color } = useTheme();
</script>

<template>
  <Meta
    name="theme-color"
    :content="color"
  />
</template>
