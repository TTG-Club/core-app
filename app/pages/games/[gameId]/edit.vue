<script setup lang="ts">
  import type { Game } from '~find-game/model';

  import { StatusCodes } from 'http-status-codes';

  import { Role } from '~/shared/types';
  import { GameForm } from '~find-game/form';
  import {
    fetchGame,
    fetchGameSessions,
    FIND_GAME_FORBIDDEN_MESSAGE,
    FIND_GAME_NOT_FOUND_MESSAGE,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_FORM_EDIT_TITLE,
    GAME_OPEN_LABEL,
    GAMES_NAVIGATION_LABEL,
    GAMES_ROUTE,
    getFindGameErrorMessage,
    getFindGameStatus,
    getGameRoute,
  } from '~find-game/model';
  import { UiResult } from '~ui/result';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  const route = useRoute();
  const { user } = useUser();

  const gameId = computed(() =>
    typeof route.params.gameId === 'string' ? route.params.gameId : '',
  );

  const {
    data: game,
    error,
    status,
  } = await useAsyncData(
    () => `find-game-edit-${toValue(gameId)}`,
    () => fetchGame(gameId.value, null),
    { watch: [gameId], deep: false, server: false },
  );

  /**
   * Есть ли у игры сессии. От этого зависит, можно ли ещё менять платность:
   * у сессий бесплатной игры нет платёжных полей, а у платной они обязательны.
   */
  const { data: sessions } = await useAsyncData(
    () => `find-game-edit-sessions-${toValue(gameId)}`,
    () => fetchGameSessions(gameId.value, null).catch(() => []),
    { watch: [gameId], deep: false, server: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isNotFound = computed(
    () => getFindGameStatus(error.value) === StatusCodes.NOT_FOUND,
  );

  // Чужую игру сервис править не даст, поэтому и форму чужому не показываем.
  const isOwner = computed(
    () => !!user.value?.id && game.value?.masterId === user.value.id,
  );

  useSeoMeta({
    title: () => game.value?.title ?? GAME_FORM_EDIT_TITLE,
  });

  /**
   * Возвращает на страницу игры после сохранения.
   * @param saved Сохранённая игра.
   */
  async function handleSaved(saved: Game): Promise<void> {
    await navigateTo(getGameRoute(saved.id, saved.inviteCode));
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="GAME_FORM_EDIT_TITLE"
    :back-to="getGameRoute(gameId)"
  >
    <template #default>
      <div
        v-if="isLoading"
        class="flex flex-col gap-4"
      >
        <USkeleton class="h-10 w-full" />

        <USkeleton class="h-32 w-full" />

        <USkeleton class="h-10 w-full" />
      </div>

      <UiResult
        v-else-if="isNotFound || !game"
        status="404"
        :title="FIND_GAME_NOT_FOUND_MESSAGE"
      >
        <template #extra>
          <UButton
            :to="GAMES_ROUTE"
            :label="GAMES_NAVIGATION_LABEL"
          />
        </template>
      </UiResult>

      <UiResult
        v-else-if="!isOwner"
        status="403"
        :title="FIND_GAME_FORBIDDEN_MESSAGE"
      >
        <template #extra>
          <UButton
            :to="getGameRoute(game.id)"
            :label="GAME_OPEN_LABEL"
          />
        </template>
      </UiResult>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        :title="FIND_GAME_UNKNOWN_ERROR_MESSAGE"
        :sub-title="getFindGameErrorMessage(error)"
      />

      <GameForm
        v-else
        :game="game"
        :has-sessions="sessions.length > 0"
        @saved="handleSaved"
      />
    </template>
  </NuxtLayout>
</template>
