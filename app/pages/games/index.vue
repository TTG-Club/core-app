<script setup lang="ts">
  import { GameCatalog, GamesHeaderActions } from '~find-game/catalog';
  import { GAMES_NAVIGATION_LABEL } from '~find-game/model';
  import { PageBackdrop } from '~ui/page';

  useSeoMeta({
    title: 'Поиск игр — D&D 5 (2024)',
    description:
      'Каталог настольных игр по D&D 5: онлайн, текстовые и офлайн-игры, ваншоты и кампании. Найдите игру по системе, формату, стоимости и возрасту.',
  });

  const { isLoggedIn } = useUser();
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="GAMES_NAVIGATION_LABEL"
  >
    <template
      v-if="isLoggedIn"
      #actions
    >
      <GamesHeaderActions />
    </template>

    <template #default>
      <PageBackdrop />

      <GameCatalog />
    </template>
  </NuxtLayout>
</template>
