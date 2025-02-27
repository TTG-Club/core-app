<script setup lang="ts">
  import { SearchPanel } from '~/features/search';
  import { HomeSections } from '~/features/sections';

  definePageMeta({
    layout: 'default',
  });

  const { name } = useSiteConfig();
</script>

<template>
  <div :class="$style.bodyContent">
    <h1 :class="$style.siteName">
      {{ name }}
    </h1>

    <AFlex
      class="$style.mainBlock"
      vertical
      align="center"
    >
      <SearchPanel />

      <HomeSections />
    </AFlex>
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

  .bodyContent {
    width: 100%;
    max-width: var(--max-content);
  }
</style>
