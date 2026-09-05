<script setup lang="ts">
  import type { Follow } from '../model';

  import { UiResult } from '~ui/result';

  import { useFollows, useParticipantNames } from '../composables';
  import {
    BOOKMARK_PLAYER_ACTIVE_LABEL,
    BOOKMARKED_PLAYERS_EMPTY_DESCRIPTION,
    BOOKMARKED_PLAYERS_EMPTY_TITLE,
    INVITE_PLAYER_LABEL,
  } from '../model';
  import { PlayerInviteModal } from './ui';

  /**
   * Отмеченные игроки: тех, с кем уже играл, легко позвать в следующую игру.
   */
  const { busyUserId, players, isPlayersLoading, togglePlayer } = useFollows();

  const { getParticipantName, resolveNames } = useParticipantNames();

  const inviteTarget = ref<Follow | null>(null);

  const isInviteOpen = computed({
    get: () => !!inviteTarget.value,
    set: (opened: boolean) => {
      if (!opened) {
        inviteTarget.value = null;
      }
    },
  });

  watch(
    players,
    (list) => {
      void resolveNames(list.map((follow) => follow.userId));
    },
    { immediate: true },
  );

  /**
   * Открывает приглашение игрока.
   * @param follow Отметка об игроке.
   */
  function openInvite(follow: Follow): void {
    inviteTarget.value = follow;
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="isPlayersLoading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-14 w-full rounded-lg"
      />
    </div>

    <UiResult
      v-else-if="!players.length"
      status="info"
      :title="BOOKMARKED_PLAYERS_EMPTY_TITLE"
      :sub-title="BOOKMARKED_PLAYERS_EMPTY_DESCRIPTION"
    />

    <template v-else>
      <div
        v-for="follow in players"
        :key="follow.userId"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-default p-3"
      >
        <span class="flex min-w-0 items-center gap-2">
          <UIcon
            name="tabler:user"
            class="size-4 shrink-0 text-muted"
          />

          <span class="truncate font-medium text-highlighted">
            {{ getParticipantName(follow.userId) }}
          </span>
        </span>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            size="sm"
            icon="tabler:mail"
            :label="INVITE_PLAYER_LABEL"
            @click.left.exact.prevent="openInvite(follow)"
          />

          <UButton
            size="sm"
            color="primary"
            variant="subtle"
            icon="tabler:star-filled"
            :loading="busyUserId === follow.userId"
            :label="BOOKMARK_PLAYER_ACTIVE_LABEL"
            @click.left.exact.prevent="togglePlayer(follow.userId)"
          />
        </div>
      </div>
    </template>

    <PlayerInviteModal
      v-model:open="isInviteOpen"
      :player-id="inviteTarget?.userId ?? null"
      :player-name="getParticipantName(inviteTarget?.userId ?? '')"
    />
  </div>
</template>
