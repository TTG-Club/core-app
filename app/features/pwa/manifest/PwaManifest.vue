<script setup lang="ts">
  const { name } = useTheme();
</script>

<template>
  <Link
    rel="manifest"
    :href="`/manifest.json?theme=${name}`"
  />
</template>
