<script setup lang="ts">
  import { HomeBanners, RoadmapBanner } from '~home/banners';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';
  import { HomeTools } from '~home/tools';
  import { SearchPanel } from '~search/panel';

  definePageMeta({
    layout: 'default',
  });

  const { name, description } = useSiteConfig();

  useSeoMeta({
    description,
  });
</script>

<template>
  <NuxtLayout>
    <div class="flex flex-col items-center gap-6">
      <h1 class="m-0 h-0 overflow-hidden leading-0 opacity-0">
        {{ name }}
      </h1>

      <SearchPanel />

      <HomeSections />

      <div class="flex w-full flex-col gap-3 lg:flex-row lg:flex-nowrap">
        <div
          class="relative flex w-full flex-col gap-3 overflow-hidden rounded-lg lg:w-2/3 lg:flex-row"
        >
          <div class="flex w-full flex-col gap-3 lg:w-1/2">
            <HomeTools />

            <RoadmapBanner />
          </div>

          <HomeBanners class="w-full lg:w-1/2" />
        </div>

        <div class="flex w-full flex-col gap-3 lg:w-1/3">
          <SocialLinks />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
