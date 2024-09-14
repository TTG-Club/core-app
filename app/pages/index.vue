<script setup lang="ts">
  const { name } = useSiteConfig();

  definePageMeta({
    layout: 'default',
  });
</script>

<template>
  <div>
    <h1 :class="$style.siteName">
      {{ name }}
    </h1>

    <header :class="$style.mainHeader">
      <Search />
    </header>
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

  .mainHeader {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 32px 0 8px;
  }
</style>
