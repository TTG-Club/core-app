<script setup lang="ts">
  import { HomeSections } from '~home/sections';
  import { SearchPanel } from '~search/panel';
  import { PageContainer } from '~ui/page';

  definePageMeta({
    layout: 'default',
  });

  const { name, description } = useSiteConfig();

  useSeoMeta({
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

      <div :class="$style.roadmap">
        <AImage
          src="/s3/roadmap.webp"
          loading="lazy"
          alt="roadmap"
        />
      </div>
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
    overflow: hidden;

    width: 100%;
    margin-top: 24px;
    border: 1px solid var(--color-border);
    border-radius: 16px;

    opacity: 0.8;
    box-shadow: 0 0.625rem 0.75rem 0 var(--color-shadow);
  }
</style>
