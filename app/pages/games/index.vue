<script setup lang="ts">
  import { GameCatalog } from '~find-game/catalog';
  import {
    GAMES_CREATE_NAVIGATION_LABEL,
    GAMES_CREATE_ROUTE,
    GAMES_MY_NAVIGATION_LABEL,
    GAMES_MY_ROUTE,
    GAMES_NAVIGATION_LABEL,
  } from '~find-game/model';
  import { NotificationsBell } from '~find-game/notifications';

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
    <template #actions>
      <NotificationsBell v-if="isLoggedIn" />

      <UButton
        v-if="isLoggedIn"
        :to="GAMES_MY_ROUTE"
        color="neutral"
        variant="ghost"
        icon="tabler:cards"
        :label="GAMES_MY_NAVIGATION_LABEL"
      />

      <UButton
        v-if="isLoggedIn"
        :to="GAMES_CREATE_ROUTE"
        icon="tabler:plus"
        :label="GAMES_CREATE_NAVIGATION_LABEL"
      />
    </template>

    <template #default>
      <GameCatalog />
    </template>
  </NuxtLayout>
</template>
