<script setup lang="ts">
  import { MulticlassDrawer } from '~classes/multiclass-drawer';
  import {
    INITIATIVE_TOOL_ROUTE,
    INITIATIVE_TOOL_TITLE,
  } from '~initiative/model';

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
    title="Токенатор"
    to="/tokenator"
    background-url="/s3/home/tokenator-banner.webp"
    description="Создай уникальный токен персонажа!"
    class="min-h-24 justify-center"
  />

  <BannerCard
    :title="INITIATIVE_TOOL_TITLE"
    :to="INITIATIVE_TOOL_ROUTE"
    background-url="/s3/home/initiative-banner.webp"
    description="Управляй порядком ходов в бою"
    class="min-h-24 justify-center"
  />

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
</template>
