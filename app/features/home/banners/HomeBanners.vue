<script setup lang="ts">
  import { MulticlassDrawer } from '~classes/multiclass-drawer';

  import { BannerCard } from './ui';

  defineProps<{
    group: 'tools' | 'info';
  }>();

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
  <template v-if="group === 'tools'">
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

  <template v-else-if="group === 'info'">
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
</template>
