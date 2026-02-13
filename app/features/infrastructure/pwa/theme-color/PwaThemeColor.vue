<script setup lang="ts">
  const { color } = useTheme();
</script>

<template>
  <Meta
    name="theme-color"
    :content="color"
  />
</template>
