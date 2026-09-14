<script setup lang="ts">
  import {
    getHomeHeroPreviewMedia,
    HOME_HERO_PREVIEW_KIND_QUERY,
    HOME_HERO_PREVIEW_PAGE_TITLE,
    HOME_HERO_PREVIEW_URL_QUERY,
  } from '~admin/home-hero/model';
  import { HomeHero } from '~home/hero';

  useSeoMeta({
    title: HOME_HERO_PREVIEW_PAGE_TITLE,
  });

  const route = useRoute();
  const { origin } = useRequestURL();

  const previewMedia = computed(() =>
    getHomeHeroPreviewMedia(
      route.query[HOME_HERO_PREVIEW_URL_QUERY],
      route.query[HOME_HERO_PREVIEW_KIND_QUERY],
      origin,
    ),
  );
</script>

<template>
  <!--
    Страница для фреймов превью в админке: одна шапка главной, без раскладки.
    Шапка рисуется только в браузере: черновик приходит локальной
    `blob:`-ссылкой, а origin, который видит сервер за прокси, с ней не
    совпадёт. Выключить серверный рендер маршрутом (`ssr: false`) нельзя —
    без него падает плагин Яндекс.Метрики (`window.ym is not a function`).
  -->
  <ClientOnly>
    <HomeHero :preview="previewMedia" />
  </ClientOnly>
</template>
