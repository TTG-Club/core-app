<script setup lang="ts">
  import { UpdatesDot } from '~ui/updates-dot';

  import { useMyGamesOverview } from '../../composables';
  import {
    GAMES_CREATE_NAVIGATION_LABEL,
    GAMES_CREATE_ROUTE,
    GAMES_MY_NAVIGATION_LABEL,
    GAMES_MY_ROUTE,
    GAMES_ROUTE,
    MY_GAMES_ATTENTION_ARIA_LABEL,
    MY_GAMES_ATTENTION_HINT,
  } from '../../model';
  import { NotificationsBell } from '../../notifications';

  const route = useRoute();

  const isMyGamesOpen = computed(() => route.path === GAMES_MY_ROUTE);

  /** Нажатые «Мои игры» при повторном нажатии возвращают в каталог. */
  const myGamesTarget = computed(() =>
    isMyGamesOpen.value ? GAMES_ROUTE : GAMES_MY_ROUTE,
  );

  const { hasAttention } = useMyGamesOverview();

  /** Точка вслух не читается, поэтому о ней говорит имя кнопки. */
  const myGamesAriaLabel = computed(() =>
    hasAttention.value
      ? MY_GAMES_ATTENTION_ARIA_LABEL
      : GAMES_MY_NAVIGATION_LABEL,
  );
</script>

<!--
  Действия шапки раздела игр — одни и те же в каталоге и в «Моих играх»:
  шапка при переключении не меняется, а «Мои игры» не исчезают и остаются
  нажатыми.

  Компонент показывается только вошедшему пользователю: у гостя нет ни своих
  игр, ни уведомлений, а сводка «Моих игр» ему ответила бы отказом.
-->
<template>
  <NotificationsBell />

  <UButton
    :to="myGamesTarget"
    :active="isMyGamesOpen"
    color="neutral"
    variant="subtle"
    active-color="primary"
    active-variant="subtle"
    icon="tabler:cards"
    :label="GAMES_MY_NAVIGATION_LABEL"
    :aria-label="myGamesAriaLabel"
  >
    <template
      v-if="hasAttention"
      #trailing
    >
      <UpdatesDot :title="MY_GAMES_ATTENTION_HINT" />
    </template>
  </UButton>

  <UButton
    :to="GAMES_CREATE_ROUTE"
    icon="tabler:plus"
    :label="GAMES_CREATE_NAVIGATION_LABEL"
  />
</template>
