<script setup lang="ts">
  import { HomeArticles } from '~home/articles';
  import { HomeBackground } from '~home/background';
  import { HomeBanners, VttgCampaignBanner } from '~home/banners';
  import { HomeCommunity } from '~home/community';
  import { HomeNews } from '~home/news';
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

      <!--
        На мобильном (< xl) колонки-обёртки схлопываются в display:contents, все
        блоки становятся прямыми флекс-элементами и выстраиваются одной колонкой в
        порядке order-*: инструменты → Новости → соцсети → статистика онлайн →
        Статьи → Обновления. На xl колонки восстанавливаются (xl:flex) — раскладка десктопа
        прежняя, трёхколоночная.
      -->
      <div class="flex w-full flex-col gap-3 xl:flex-row xl:items-start">
        <!-- Новости -->
        <div class="contents xl:flex xl:w-1/3 xl:flex-col xl:gap-3 2xl:w-1/3">
          <HomeNews class="order-2 xl:order-0" />
        </div>

        <!-- Навигация по сайту и обновления -->
        <div class="contents xl:flex xl:w-1/3 xl:flex-col xl:gap-3 2xl:w-1/3">
          <div class="order-1 grid grid-cols-2 gap-3 xl:order-0">
            <HomeBanners />
          </div>

          <HomeArticles class="order-5 xl:order-0" />

          <HomeRecentChanges class="order-6 xl:order-0" />
        </div>

        <!-- Соцсети, статистика проекта и охотники за багами -->
        <div class="contents xl:flex xl:w-1/3 xl:flex-col xl:gap-3 2xl:w-1/3">
          <SocialLinks class="order-3 xl:order-0" />

          <HomeCommunity class="order-4 xl:order-0" />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
