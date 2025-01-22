<script setup lang="ts">
  const {
    site: { name },
  } = useRuntimeConfig();

  definePageMeta({
    layout: 'default',
  });
</script>

<template>
  <div>
    <h1 :class="$style.siteName">
      {{ name }}
    </h1>
  </div>
</template>

<style module>
  .siteName {
    overflow: hidden;

    height: 0;
    margin: 0;

    line-height: 0;

    opacity: 0;
  }
</style>
