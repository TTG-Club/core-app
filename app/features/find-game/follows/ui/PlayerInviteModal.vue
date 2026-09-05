<script setup lang="ts">
  import {
    CANCEL_LABEL,
    fetchMyGames,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    getFindGameErrorMessage,
    INVITE_GAME_LABEL,
    INVITE_GAME_PLACEHOLDER,
    INVITE_NO_GAMES_HINT,
    INVITE_PLAYER_DESCRIPTION,
    INVITE_PLAYER_LABEL,
    INVITE_PLAYER_TITLE,
    INVITE_SENT_TOAST,
    invitePlayer,
    MY_GAMES_PAGE_SIZE,
  } from '../../model';

  /**
   * Приглашение отмеченного игрока в свою игру.
   *
   * Зовут ссылкой, а не местом в составе: игрок получает уведомление и подаёт
   * заявку сам. Взять человека в игру, не спросив его, значило бы записать
   * его в чужое расписание.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { playerId, playerName } = defineProps<{
    /** Кого зовут; `null` — окно закрыто. */
    playerId: string | null;
    playerName: string;
  }>();

  const toast = useToast();
  const pickedGameId = ref<string>('');
  const isSending = ref(false);

  // Звать можно только туда, где открыт набор: в закрытую игру сервис
  // приглашение не примет.
  const { data: games, status } = useAsyncData(
    'find-game-invitable-games',
    async () => {
      const page = await fetchMyGames(0, MY_GAMES_PAGE_SIZE, ['OPEN']);

      return page.content.filter((game) => !game.recruitmentClosed);
    },
    { server: false, deep: false, default: () => [] },
  );

  const gameItems = computed(() =>
    games.value.map((game) => ({ label: game.title, value: game.id })),
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isEmpty = computed(() => !isLoading.value && !gameItems.value.length);

  /** Отправляет приглашение и закрывает окно. */
  async function submit(): Promise<void> {
    if (!playerId || !pickedGameId.value) {
      return;
    }

    isSending.value = true;

    try {
      await invitePlayer(pickedGameId.value, playerId);

      toast.add({
        title: INVITE_SENT_TOAST,
        color: 'success',
        icon: 'tabler:check',
      });

      isOpen.value = false;
    } catch (error) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isSending.value = false;
    }
  }

  // Выбор чистится на каждом открытии: прошлая игра к новому игроку
  // отношения не имеет.
  watch(isOpen, (opened) => {
    if (opened) {
      pickedGameId.value = '';
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="INVITE_PLAYER_TITLE"
    :description="playerName"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">{{ INVITE_PLAYER_DESCRIPTION }}</p>

        <UFormField
          :label="INVITE_GAME_LABEL"
          :hint="isEmpty ? INVITE_NO_GAMES_HINT : ''"
        >
          <USelect
            v-model="pickedGameId"
            :items="gameItems"
            value-key="value"
            :loading="isLoading"
            :disabled="isEmpty"
            :placeholder="INVITE_GAME_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="isSending"
          :label="CANCEL_LABEL"
          @click.left.exact.prevent="isOpen = false"
        />

        <UButton
          icon="tabler:mail"
          :loading="isSending"
          :disabled="!pickedGameId"
          :label="INVITE_PLAYER_LABEL"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
