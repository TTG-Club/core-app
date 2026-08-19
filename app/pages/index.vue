<script setup lang="ts">
  import { HomeArticles } from '~home/articles';
  import { HomeBackground } from '~home/background';
  import { VttgPromoCard } from '~home/banners';
  import { HomeComments } from '~home/comments';
  import { HomeCommunity } from '~home/community';
  import { HomeNews } from '~home/news';
  import { HomeRecentChanges } from '~home/recent-changes';
  import { HomeSections } from '~home/sections';
  import { SocialLinks } from '~home/social-links';
  import { HomeTools } from '~home/tools';
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

      <HomeSections />

      <!--
        На мобильном (< xl) колонки-обёртки схлопываются в display:contents, все
        блоки становятся прямыми флекс-элементами и выстраиваются одной колонкой в
        порядке order-*: промо VTTG → инструменты → Новости → Комментарии →
        соцсети → статистика онлайн → Статьи → Обновления. Комментарии идут сразу
        за новостями — там же, где стоят в первой колонке на десктопе.
        На xl колонки восстанавливаются (xl:flex) — раскладка десктопа
        прежняя, трёхколоночная.
      -->
      <!-- items-stretch: колонки одной высоты, чтобы лента комментариев в
        первой из них дотягивалась до низа самой длинной колонки -->
      <div class="flex w-full flex-col gap-3 xl:flex-row xl:items-stretch">
        <!-- Новости и живая лента обсуждений -->
        <div class="contents xl:flex xl:w-1/3 xl:flex-col xl:gap-3 2xl:w-1/3">
          <HomeNews class="order-2 xl:order-0" />

          <!-- Лента вынута из потока (absolute внутри растянутой ячейки): так её
            собственная высота не удлиняет колонку, а сама она занимает ровно
            остаток — и низ колонки совпадает с соседними -->
          <div
            class="order-3 xl:relative xl:order-0 xl:min-h-100 xl:min-w-0 xl:flex-1"
          >
            <HomeComments class="xl:absolute xl:inset-0" />
          </div>
        </div>

        <!-- Навигация по сайту и обновления -->
        <div class="contents xl:flex xl:w-1/3 xl:flex-col xl:gap-3 2xl:w-1/3">
          <VttgPromoCard class="order-0" />

          <HomeTools class="order-1 xl:order-0" />

          <HomeArticles class="order-6 xl:order-0" />

          <HomeRecentChanges class="order-7 xl:order-0" />
        </div>

        <!-- Соцсети, статистика проекта и охотники за багами -->
        <div class="contents xl:flex xl:w-1/3 xl:flex-col xl:gap-3 2xl:w-1/3">
          <SocialLinks class="order-4 xl:order-0" />

          <HomeCommunity class="order-5 xl:order-0" />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
