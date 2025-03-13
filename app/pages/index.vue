<script setup lang="ts">
  import { SearchPanel } from '~search/panel';
  import { HomeSections } from '~home/sections';
  import { PageContainer } from '~ui/page';

  definePageMeta({
    layout: 'default',
  });

  const { name, description } = useSiteConfig();

  useSeoMeta({
    title: name,
    description,
  });
</script>

<template>
  <PageContainer>
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
        src="https://s3.timeweb.cloud/1f63c517-f215af24-4c0a-4ac8-aba5-c6a08af65777/roadmap.webp"
      />
    </AFlex>
  </PageContainer>
</template>

<style module>
  .siteName {
    overflow: hidden;

    height: 0;
    margin: 0;

    line-height: 0;

    opacity: 0;
  }

  .roadmap {
    width: 100%;
    margin-top: 24px;
    border: 1px solid var(--color-border);
    border-radius: 16px;

    opacity: 0.8;
    box-shadow: 0 0.625rem 0.75rem 0 var(--color-card-shadow);
  }
</style>
