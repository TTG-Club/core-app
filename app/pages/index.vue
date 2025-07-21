<script setup lang="ts">
  import { HomeBanners } from '~home/banners';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';
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

      <div class="flex w-full flex-col gap-3 lg:items-start xl:flex-row">
        <div
          class="w-full overflow-hidden rounded-lg border border-(--color-border) opacity-80 xl:w-1/2 2xl:w-2/3"
        >
          <img
            :src="'/s3/roadmap.webp'"
            loading="lazy"
            alt="roadmap"
          />
        </div>

        <div class="flex w-full flex-col gap-3 xl:w-1/2 2xl:w-1/3">
          <HomeBanners />

          <SocialLinks />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
