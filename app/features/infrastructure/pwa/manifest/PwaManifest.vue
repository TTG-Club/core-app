<script setup lang="ts">
  // У своей темы манифест берётся от её основы — тёмной или светлой
  const { baseName } = useTheme();
</script>

<template>
  <Link
    rel="manifest"
    :href="`/manifest.json?theme=${baseName}`"
  />
</template>
