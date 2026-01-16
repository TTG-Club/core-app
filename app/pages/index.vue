<script setup lang="ts">
  import { HomeBanners, RoadmapBanner } from '~home/banners';
  import { RecentChanges } from '~home/recent-changes';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';
  import { SearchPanel } from '~search/panel';
  import { UiPlaceholder } from '~ui/placeholder';

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

      <div class="flex w-full flex-col gap-3 lg:items-start xl:flex-row">
        <div
          class="relative flex w-full flex-col gap-3 overflow-hidden rounded-lg xl:w-1/3 2xl:w-1/3"
        >
          <RoadmapBanner />

          <UiPlaceholder class="hidden min-h-32 flex-1 xl:block" />
        </div>

        <div class="relative flex w-full flex-col gap-3 xl:w-1/3 2xl:w-1/3">
          <HomeBanners />

          <RecentChanges />
        </div>

        <div class="flex w-full flex-col gap-3 xl:w-1/2 2xl:w-1/3">
          <SocialLinks />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
