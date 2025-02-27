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

      <AImage
        alt="roadmap"
        loading="lazy"
        :class="$style.roadmap"
        src="https://s3.timeweb.cloud/1f63c517-f215af24-4c0a-4ac8-aba5-c6a08af65777/sections/home-link/roadmap.png"
      />
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

  .roadmap {
    width: 100%;
    margin-top: 24px;

    opacity: 0.8;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    box-shadow: 0 0.625rem 0.75rem 0 var(--color-card-shadow);
  }
</style>
