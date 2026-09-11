<script setup lang="ts">
  import { HomeCounters } from '~home/counters';
  import { HomeTools } from '~home/tools';
  import { SearchPanel } from '~infrastructure/search';

  import { HOME_HERO_SUBTITLE, HOME_HERO_TITLE } from './model';
</script>

<template>
  <!--
    Шапка главной идёт во всю ширину экрана: колонка контента начинается только
    ниже, в сетке блоков. `isolate` держит декоративные слои — карту и
    свечение — внутри шапки, под её содержимым.
  -->
  <section
    class="relative isolate w-full overflow-hidden border-b border-default"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-1"
    >
      <!-- Карта деревни с высоты птичьего полёта: рисунок под каждую тему
        лежит в `public/img/home`, выбирает его токен `--hero-map-image` -->
      <div :class="$style.map" />

      <!-- Тёплое свечение по центру — «очаг», к которому стягивается взгляд -->
      <div :class="$style.glow" />
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
  /* Уже этой ширины карта не сжимается: края уходят за экран, а дома
     остаются различимыми */
  $mapMinWidth: 1600px;

  /* Масштаб карты задаёт только ширина шапки, не высота: высота растёт, когда
     подгружается персонаж с репликой, и карта при `cover` прыгала бы. Холст
     с запасом по высоте, поэтому шапку он закрывает и так */
  .map {
    position: absolute;
    inset: 0;

    opacity: var(--hero-map-opacity);
    background: var(--hero-map-image) center / max(100%, $mapMinWidth) auto
      no-repeat;

    /* Под заголовком и поиском карта почти растворяется, по бокам видна
       целиком; сверху и снизу тает, чтобы не упираться в края шапки */
    mask-image:
      linear-gradient(
        to right,
        #000 12%,
        rgb(0 0 0 / 22%) 32%,
        rgb(0 0 0 / 22%) 68%,
        #000 88%
      ),
      linear-gradient(
        to bottom,
        transparent 0%,
        #000 15%,
        #000 85%,
        transparent 100%
      );
    mask-composite: intersect;
  }

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
</style>
