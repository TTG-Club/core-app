<script setup lang="ts">
  import { HomeActivity } from '~home/activity';
  import { HomeArticles } from '~home/articles';
  import { HomeBackground } from '~home/background';
  import { VttgPromoCard } from '~home/banners';
  import { HomeCommunity } from '~home/community';
  import { HomeHero } from '~home/hero';
  import { HomeLatestGame } from '~home/latest-game';
  import { HomeNews } from '~home/news';
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
        в порядке order-*: VTTG → Соцсети → Новости → Новая игра → Статьи →
        Жизнь сайта → Сообщество.

        С xl лента делится на две половины, растянутые друг под друга
        (`items-stretch`). Слева столбец новостей и статей. Справа два ряда из
        двух узких столбцов:

        - верхний — новая игра и VTTG с соцсетями. Ряд `items-stretch`, поэтому
          низ игры совпадает с низом соцсетей: высоту задают VTTG и соцсети, а
          обложка игры забирает разницу (если игра всё же выше, растягивается
          VTTG);
        - нижний — жизнь сайта и сообщество, оба начинаются с одной линии.
          Ряд `flex-1` дотягивает правую половину до низа статей: лента
          обсуждений растягивается на всю высоту, сообщество живёт по своей.

        Связать высоты можно только у соседей по одному ряду — поэтому игра и
        VTTG стоят в общем ряду, а не в разных столбцах.

        На 2K колонка растёт вместе с `--max-content-wide`, и ширина монитора
        уходит в контент, а не в пустые поля.
      -->
      <div class="flex w-full flex-col gap-3 xl:flex-row xl:items-stretch">
        <div class="contents xl:flex xl:w-1/2 xl:flex-col xl:gap-3">
          <HomeNews class="order-2 xl:order-0" />

          <HomeArticles class="order-4 xl:order-0" />
        </div>

        <div class="contents xl:flex xl:w-1/2 xl:flex-col xl:gap-3">
          <div class="contents xl:flex xl:flex-row xl:items-stretch xl:gap-3">
            <HomeLatestGame class="order-3 xl:order-0 xl:w-1/2" />

            <div class="contents xl:flex xl:w-1/2 xl:flex-col xl:gap-3">
              <VttgPromoCard class="order-0 xl:flex-1" />

              <SocialLinks class="order-1 xl:order-0" />
            </div>
          </div>

          <div
            class="contents xl:flex xl:flex-1 xl:flex-row xl:items-start xl:gap-3"
          >
            <!-- min-h — страховка на случай, когда левая половина короче
              обычного (скажем, новости не загрузились): без неё ленте
              досталась бы только шапка с подвалом -->
            <HomeActivity
              class="order-5 xl:order-0 xl:min-h-80 xl:w-1/2 xl:self-stretch"
            />

            <HomeCommunity class="order-6 xl:order-0 xl:w-1/2" />
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
