<script setup lang="ts">
  import type { Game } from '~find-game/model';

  import { Role } from '~/shared/types';
  import { GameForm } from '~find-game/form';
  import { GameInviteCard } from '~find-game/game';
  import {
    GAME_FORM_TITLE,
    GAME_OPEN_LABEL,
    GAMES_ROUTE,
    getGameRoute,
  } from '~find-game/model';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  useSeoMeta({
    title: GAME_FORM_TITLE,
  });

  /**
   * Созданная приватная игра остаётся на экране ради кода приглашения: он
   * приходит только в ответе на создание, и в дальнейших `GET`-ответах
   * публичного API его нет.
   */
  const createdPrivateGame = ref<Game | null>(null);

  /**
   * Публичную игру открываем сразу, приватную — показываем со ссылкой.
   * @param game Созданная игра.
   */
  async function handleCreated(game: Game): Promise<void> {
    if (game.visibility === 'PRIVATE' && game.inviteCode) {
      createdPrivateGame.value = game;

      return;
    }

    await navigateTo(getGameRoute(game.id));
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="GAME_FORM_TITLE"
    :back-to="GAMES_ROUTE"
  >
    <template #default>
      <div
        v-if="createdPrivateGame?.inviteCode"
        class="flex flex-col gap-4"
      >
        <GameInviteCard
          :game-id="createdPrivateGame.id"
          :invite-code="createdPrivateGame.inviteCode"
        />

        <UButton
          class="self-start"
          icon="tabler:arrow-right"
          :to="
            getGameRoute(createdPrivateGame.id, createdPrivateGame.inviteCode)
          "
          :label="GAME_OPEN_LABEL"
        />
      </div>

      <GameForm
        v-else
        @saved="handleCreated"
      />
    </template>
  </NuxtLayout>
</template>
