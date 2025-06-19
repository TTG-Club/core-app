<script setup lang="ts">
  import { useTheme } from '~/shared/composables';

  const { name } = useTheme();
</script>

<template>
  <Link
    rel="manifest"
    :href="`/manifest.json?theme=${name}`"
  />
</template>
