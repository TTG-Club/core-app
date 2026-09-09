<script setup lang="ts">
  import { HomeActivity } from '~home/activity';
  import { HomeArticles } from '~home/articles';
  import { HomeBackground } from '~home/background';
  import { VttgPromoCard } from '~home/banners';
  import { HomeCommunity } from '~home/community';
  import { HomeHero } from '~home/hero';
  import { HomeNews } from '~home/news';
  import { HomePartyFinderSlot } from '~home/party-finder';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';

  definePageMeta({
    layout: 'home',
  });

  const { description } = useSiteConfig();

  useSeoMeta({
    description,
  });
</script>

<template>
  <NuxtLayout>
    <ClientOnly>
      <HomeBackground />
    </ClientOnly>

    <HomeHero />

    <!-- gap-6/8 между зонами: плита разделов и лента — разные по смыслу полосы,
      им нужен воздух шире, чем зазор между соседними панелями внутри ленты -->
    <div
      class="mx-auto flex w-full max-w-(--max-content) flex-col gap-6 px-4 pt-6 lg:gap-8 lg:pt-8 2xl:max-w-(--max-content-wide)"
    >
      <HomeSections />

      <!--
        Ниже xl все обёртки схлопываются в display:contents: блоки становятся
        прямыми флекс-элементами внешней колонки и выстраиваются одним потоком
        в порядке order-*: Новости → VTTG → Жизнь сайта → Статьи → Поиск
        игроков → Соцсети → Сообщество.

        С xl лента делится на две части. Слева два столбца, чьи ряды идут
        `items-stretch`: высоту первого задают новости, второго — статьи, а
        соседи по ряду подстраиваются под них независимо от того, сколько в них
        содержимого. В одной колонке связать высоты нечем — CSS равняет только
        соседей по ряду. Справа обычный сплошной столбец: он не знает про эти
        ряды и не ждёт их конца, поэтому сообщество идёт сразу за соцсетями.

        На 2K колонка растёт вместе с `--max-content-wide`, и ширина монитора
        уходит в контент, а не в пустые поля.
      -->
      <div class="flex w-full flex-col gap-3 xl:flex-row xl:items-start">
        <div class="contents xl:flex xl:w-3/4 xl:flex-col xl:gap-3">
          <div class="contents xl:flex xl:flex-row xl:items-stretch xl:gap-3">
            <HomeNews class="order-0 xl:w-2/3" />

            <HomeActivity class="order-2 xl:order-0 xl:w-1/3" />
          </div>

          <div class="contents xl:flex xl:flex-row xl:items-stretch xl:gap-3">
            <HomeArticles class="order-3 xl:order-0 xl:w-2/3" />

            <HomePartyFinderSlot class="order-4 xl:order-0 xl:w-1/3" />
          </div>
        </div>

        <div class="contents xl:flex xl:w-1/4 xl:flex-col xl:gap-3">
          <VttgPromoCard class="order-1 xl:order-0" />

          <SocialLinks class="order-5 xl:order-0" />

          <HomeCommunity class="order-6 xl:order-0" />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
