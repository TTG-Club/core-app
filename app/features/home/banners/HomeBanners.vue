<script setup lang="ts">
  import { MulticlassDrawer } from '~classes/multiclass-drawer';

  import { BannerCard } from './ui';

  const overlay = useOverlay();

  const multiclassDrawer = overlay.create(MulticlassDrawer, {
    props: {
      url: '',
      name: {
        rus: '',
        eng: '',
      },
      parent: undefined,
      onClose: () => multiclassDrawer.close(),
    },
    destroyOnClose: true,
  });
</script>

<template>
  <BannerCard
    title="Создание мультикласса"
    background-url="/s3/home/multiclassing-banner.webp"
    description="Собери уникальную комбинацию классов"
    @click="multiclassDrawer.open()"
  />

  <BannerCard
    title="Калькулятор характеристик"
    to="/calculators/abilities"
    background-url="/s3/home/calculator-abilities-banner.webp"
    description="Идеальный баланс твоего персонажа"
  />

  <BannerCard
    title="Токенатор"
    to="/tokenator"
    background-url="/s3/home/tokenator-banner.webp"
    description="Создай уникальный токен персонажа!"
  />

  <BannerCard
    title="Дорожная карта"
    to="/roadmap"
    background-url="/s3/home/roadmap-banner.webp"
    description="Выбор за тобой!"
  />
</template>
