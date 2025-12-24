<script setup lang="ts">
  import { HomeBanners, RoadmapBanner } from '~home/banners';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';
  import { SearchPanel } from '~search/panel';
  import { UiPlaceholder } from '~ui/placeholder';
  import LastUpdate from '~home/update/LastUpdate.vue';

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

      <div
        class="flex w-full flex-col gap-3 lg:items-start xl:flex-row xl:items-stretch"
      >
        <div
          class="relative flex w-full flex-col gap-3 overflow-hidden rounded-lg xl:w-1/3 2xl:w-1/3"
        >
          <RoadmapBanner />

          <UiPlaceholder class="hidden flex-1 xl:block" />
        </div>

        <div
          class="relative flex w-full flex-col gap-3 overflow-hidden rounded-lg xl:w-1/3 2xl:w-1/3"
        >
          <HomeBanners />

          <UiPlaceholder class="hidden flex-1 xl:block" />
        </div>

        <div class="flex w-full flex-col gap-3 xl:w-1/2 2xl:w-1/3">
          <SocialLinks />
        </div>

        <div class="flex w-full flex-col gap-3 xl:w-1/2 2xl:w-1/3">
          <LastUpdate />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
