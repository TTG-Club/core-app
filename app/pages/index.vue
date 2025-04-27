<script setup lang="ts">
  import { HomeBanners } from '~home/banners';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';
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

    <div class="$style.mainBlock">
      <SearchPanel />

      <HomeSections />

      <ARow
        :gutter="[12, 12]"
        :class="$style.row"
      >
        <ACol
          :xs="24"
          :md="18"
          :xl="16"
        >
          <div :class="$style.roadmap">
            <AImage
              src="/s3/roadmap.webp"
              loading="lazy"
              alt="roadmap"
            />
          </div>
        </ACol>

        <ACol
          :xs="24"
          :md="6"
          :xl="8"
        >
          <HomeBanners />

          <SocialLinks />
        </ACol>
      </ARow>
    </div>
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

  .row {
    margin-top: 24px;
  }

  .roadmap {
    overflow: hidden;

    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: 10px;

    opacity: 0.8;
  }
</style>
