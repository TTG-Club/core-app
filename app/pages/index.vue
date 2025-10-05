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
          class="relative hidden h-[300px] w-full overflow-hidden rounded-lg border border-dashed border-default xl:block xl:w-1/3 2xl:w-1/3"
        >
          <svg
            class="absolute inset-0 h-full w-full stroke-inverted/10"
            fill="none"
          >
            <defs>
              <pattern
                id="pattern-5c1e4f0e-62d5-498b-8ff0-cf77bb448c8e"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
              </pattern>
            </defs>

            <rect
              stroke="none"
              fill="url(#pattern-5c1e4f0e-62d5-498b-8ff0-cf77bb448c8e)"
              width="100%"
              height="100%"
            ></rect>
          </svg>
        </div>

        <div
          class="relative flex w-full flex-col gap-3 overflow-hidden rounded-lg xl:w-1/3 2xl:w-1/3"
        >
          <HomeBanners />

          <div
            class="relative hidden h-[148px] overflow-hidden rounded-lg border border-dashed border-default xl:block"
          >
            <svg
              class="absolute inset-0 h-full w-full stroke-inverted/10"
              fill="none"
            >
              <defs>
                <pattern
                  id="pattern-5c1e4f0e-62d5-498b-8ff0-cf77bb448c8e"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
                </pattern>
              </defs>

              <rect
                stroke="none"
                fill="url(#pattern-5c1e4f0e-62d5-498b-8ff0-cf77bb448c8e)"
                width="100%"
                height="100%"
              ></rect>
            </svg>
          </div>
        </div>

        <div class="flex w-full flex-col gap-3 xl:w-1/2 2xl:w-1/3">
          <SocialLinks />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
