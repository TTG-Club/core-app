<script setup lang="ts">
  import { BannerLink } from './ui';
</script>

<template>
  <BannerLink
    title="Калькулятор характеристик"
    to="/calculators/abilities"
    background-url="/s3/home/calculator-abilities-banner.webp"
    description="Идеальный баланс твоего персонажа"
  />

  <BannerLink
    title="Токенатор"
    to="/tokenator"
    background-url="/s3/home/tokenator-banner.webp"
    description="Создай уникальный токен персонажа!"
  />

  <BannerLink
    title="Дорожная карта"
    to="/roadmap"
    background-url="/s3/home/roadmap-banner.webp"
    description="Выбор за тобой!"
  />
</template>
