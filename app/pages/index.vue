<script setup lang="ts">
  import { HomeBackground } from '~home/background';
  import { HomeBanners, VttgCampaignBanner } from '~home/banners';
  import { HomeBugLeaderboard } from '~home/bug-leaderboard';
  import { HomeCounters } from '~home/counters';
  import { HomeRecentChanges } from '~home/recent-changes';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';
  import { SearchPanel } from '~infrastructure/search';

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
    <ClientOnly>
      <HomeBackground />
    </ClientOnly>

    <div class="flex flex-col items-center gap-6">
      <h1 class="m-0 h-0 overflow-hidden leading-0 opacity-0">
        {{ name }}
      </h1>

      <SearchPanel />

      <VttgCampaignBanner />

      <HomeSections />

      <div class="flex w-full flex-col gap-3 lg:items-start xl:flex-row">
        <div class="flex w-full flex-col gap-3 xl:w-1/3 2xl:w-1/3">
          <div class="grid grid-cols-2 gap-3">
            <HomeBanners group="tools" />

            <HomeBanners group="info" />
          </div>

          <HomeBugLeaderboard />
        </div>

        <div class="flex w-full flex-col gap-3 xl:w-1/3 2xl:w-1/3">
          <HomeRecentChanges />
        </div>

        <div class="flex w-full flex-col gap-3 xl:w-1/3 2xl:w-1/3">
          <HomeCounters />

          <SocialLinks />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
