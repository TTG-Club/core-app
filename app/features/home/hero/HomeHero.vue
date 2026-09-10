<script setup lang="ts">
  import { HomeCounters } from '~home/counters';
  import { HomeTools } from '~home/tools';
  import { SearchPanel } from '~infrastructure/search';

  import { HOME_HERO_SUBTITLE, HOME_HERO_TITLE } from './model';
</script>

<template>
  <!--
    Шапка главной идёт во всю ширину экрана: колонка контента начинается только
    ниже, в сетке блоков. `isolate` держит декоративные слои внутри — фоновая
    анимация частиц (HomeBackground) лежит ниже, на уровне страницы, и светится
    сквозь прозрачный герой.
  -->
  <section
    class="relative isolate w-full overflow-hidden border-b border-default"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-1"
    >
      <!-- Тёплое свечение по центру — «очаг», к которому стягивается взгляд -->
      <div :class="$style.glow" />

      <!-- Волосяная клетка: даёт фактуру пустому месту по краям -->
      <div :class="$style.grid" />
    </div>

    <div
      class="mx-auto flex w-full max-w-(--max-content) flex-col items-center gap-5 px-4 pt-6 pb-8 sm:gap-6 lg:pt-10 lg:pb-12 2xl:max-w-(--max-content-wide)"
    >
      <HomeCounters />

      <!-- На 360px и уже заголовок ужат: в полный размер он разбивался на пять
        строк. У подписи межстрочный интервал задан вместе с размером
        (`/tight`): `text-lg` приносит свой интервал, а `leading-tight`
        заголовка в Tailwind не наследуется -->
      <h1
        class="max-w-4xl text-center text-3xl leading-tight font-semibold tracking-tight text-balance max-2xs:text-2xl 3xl:text-5xl sm:text-4xl xl:text-[2.5rem]"
      >
        <span class="block text-highlighted">{{ HOME_HERO_TITLE }}</span>

        <span class="block text-muted max-2xs:text-lg/tight">{{
          HOME_HERO_SUBTITLE
        }}</span>
      </h1>

      <!-- Персонаж с репликой живёт внутри SearchPanel — он выглядывает
        из-за строки поиска, поэтому и стоит в одном блоке с ней -->
      <SearchPanel />

      <HomeTools />
    </div>
  </section>
</template>

<style lang="scss" module>
  .glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        60% 70% at 50% 0%,
        color-mix(in oklch, var(--ui-primary) 16%, transparent) 0%,
        transparent 70%
      ),
      radial-gradient(
        90% 100% at 50% 100%,
        color-mix(in oklch, var(--ui-bg-elevated) 55%, transparent) 0%,
        transparent 75%
      );
  }

  .grid {
    position: absolute;
    inset: 0;
    /* Клетка видна только по краям — под текстом она мешала бы читать */
    opacity: 0.75;
    /* Два повтора с одним шагом дают квадратную клетку, а не полоски */
    background-image:
      repeating-linear-gradient(
        to right,
        var(--color-backdrop-grid) 0 1px,
        transparent 1px 96px
      ),
      repeating-linear-gradient(
        to bottom,
        var(--color-backdrop-grid) 0 1px,
        transparent 1px 96px
      );

    mask-image: linear-gradient(
      to right,
      #000 0%,
      transparent 24%,
      transparent 76%,
      #000 100%
    );
  }
</style>
