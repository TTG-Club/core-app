<script setup lang="ts">
  import { useTheme } from '~/shared/composables';

  const { themeName } = useTheme();
</script>

<template>
  <Link
    rel="manifest"
    :href="`/manifest.json?theme=${themeName}`"
  />
</template>
